import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("Postgres RLS isolates two owners, rejects anonymous/tampered writes and stale revisions", async () => {
  const db = await PGlite.create();
  const ownerA = "11111111-1111-4111-8111-111111111111";
  const ownerB = "22222222-2222-4222-8222-222222222222";
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const snapshot = JSON.stringify({
    version: 1,
    groupName: "ก๊วน A",
    players: [],
    history: [],
  });
  try {
    await db.exec(
      `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to authenticated;`,
    );
    await db.query("insert into auth.users values ($1),($2)", [ownerA, ownerB]);
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/202611120001_private_groups.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select * from public.courtmate_groups"),
      (e) => e.code === "42501",
    );
    await db.exec("reset role; set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerA,
    ]);
    await db.query(
      "insert into public.courtmate_groups(id,owner_id,name,snapshot) values ($1,$2,$3,$4::jsonb)",
      [id, ownerA, "ก๊วน A", snapshot],
    );
    assert.equal(
      (await db.query("select revision from public.courtmate_groups")).rows[0]
        .revision,
      1,
    );
    await assert.rejects(
      db.query(
        "insert into public.courtmate_groups(id,owner_id,name,snapshot) values ($1,$2,$3,$4::jsonb)",
        [id, ownerA, "ก๊วน A", snapshot],
      ),
      (e) => e.code === "23505",
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerB,
    ]);
    assert.equal(
      (
        await db.query("select * from public.courtmate_groups where id=$1", [
          id,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update public.courtmate_groups set name=name where id=$1 returning id",
          [id],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.courtmate_groups(owner_id,name,snapshot) values ($1,$2,$3::jsonb)",
        [ownerA, "ก๊วน A", snapshot],
      ),
      (e) => e.code === "42501",
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerA,
    ]);
    await assert.rejects(
      db.query("update public.courtmate_groups set owner_id=$1", [ownerB]),
      (e) => e.code === "42501",
    );
    await assert.rejects(
      db.query("update public.courtmate_groups set revision=500"),
      (e) => e.code === "42501",
    );
    await assert.rejects(
      db.query("delete from public.courtmate_groups"),
      (e) => e.code === "42501",
    );
    await assert.rejects(
      db.query("update public.courtmate_groups set snapshot='{}'::jsonb"),
      (e) => e.code === "23514",
    );
    const next = await db.query(
      "update public.courtmate_groups set snapshot=snapshot where id=$1 and revision=1 returning revision",
      [id],
    );
    assert.equal(next.rows[0].revision, 2);
    const stale = await db.query(
      "update public.courtmate_groups set snapshot=snapshot where id=$1 and revision=1 returning revision",
      [id],
    );
    assert.equal(stale.rows.length, 0);
    assert.equal(
      (
        await db.query(
          "select revision from public.courtmate_groups where id=$1",
          [id],
        )
      ).rows[0].revision,
      2,
    );
    await db.exec("reset role");
    await db.exec(
      readFileSync(
        new URL(
          "../supabase/migrations/202611120002_readonly_invites.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const privateData = {
      version: 1,
      groupName: "ก๊วน A",
      players: [
        {
          id: 1,
          name: "ต้น",
          level: 3,
          avatar: 8,
          games: 99,
          available: false,
        },
      ],
      history: [],
      costFields: { rate: "180" },
      ownerEmail: "private@example.invalid",
      extras: [{ name: "ส่วนตัว", amount: 900 }],
    };
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerA,
    ]);
    await db.query(
      "update public.courtmate_groups set snapshot=$1::jsonb where id=$2",
      [JSON.stringify(privateData), id],
    );
    const tokenA = "a".repeat(64),
      tokenB = "b".repeat(64);
    await db.query("select public.courtmate_publish_invite($1,$2)", [
      id,
      tokenA,
    ]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerB,
    ]);
    await assert.rejects(
      db.query("select public.courtmate_publish_invite($1,$2)", [id, tokenB]),
      (e) => e.code === "42501",
    );
    await db.query("select public.courtmate_revoke_invite($1)", [id]);
    await db.exec("reset role;set role anon");
    await assert.rejects(
      db.query("select * from public.courtmate_invites"),
      (e) => e.code === "42501",
    );
    await assert.rejects(
      db.query("select public.courtmate_publish_invite($1,$2)", [id, tokenB]),
      (e) => e.code === "42501",
    );
    await assert.rejects(
      db.query("select public.courtmate_revoke_invite($1)", [id]),
      (e) => e.code === "42501",
    );
    const read = async (token) =>
      (
        await db.query("select public.courtmate_read_invite($1,$2) as roster", [
          id,
          token,
        ])
      ).rows[0].roster;
    const shared = await read(tokenA);
    assert.equal(shared.groupName, "ก๊วน A");
    assert.deepEqual(shared.players, [
      { id: 1, name: "ต้น", level: 3, avatar: 8 },
    ]);
    assert.deepEqual(Object.keys(shared).sort(), [
      "groupName",
      "players",
      "updated_at",
    ]);
    assert.equal(await read(tokenB), null);
    await db.exec("reset role;set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerA,
    ]);
    await db.query("select public.courtmate_publish_invite($1,$2)", [
      id,
      tokenB,
    ]);
    await db.exec("reset role;set role anon");
    assert.equal(await read(tokenA), null);
    assert.equal((await read(tokenB)).players[0].name, "ต้น");
    await db.exec("reset role;set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      ownerA,
    ]);
    await db.query("select public.courtmate_revoke_invite($1)", [id]);
    await db.exec("reset role;set role anon");
    assert.equal(await read(tokenB), null);
    await db.exec(
      "reset role;update public.courtmate_invites set revoked_at=null,expires_at=now()-interval '1 minute';set role anon",
    );
    assert.equal(await read(tokenB), null);
  } finally {
    await db.close();
  }
});
