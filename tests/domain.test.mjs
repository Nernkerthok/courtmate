import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  autoPair,
  completeMatch,
  calculateBill,
  updatePlayer,
  cancelPendingMatch,
  replacePendingMatch,
  gameRate,
  avatarNames,
  playerAvatar,
} from "../.test-build/domain.js";
const fixtures = JSON.parse(
  fs.readFileSync(new URL("./billing-cases.json", import.meta.url), "utf8"),
);
const players = (games) =>
  games.map((games, i) => ({
    id: i + 1,
    name: `คน${i + 1}`,
    games,
    level: (i % 5) + 1,
    available: true,
  }));
for (const f of fixtures)
  test(f.name, () => {
    const b = calculateBill(players(f.games), f.costs);
    assert.deepEqual(
      b.rows.map((p) => p.cents),
      f.expected,
    );
    assert.equal(b.totalCents, f.total);
    assert.equal(
      b.rows.reduce((s, r) => s + r.cents, 0),
      f.total,
    );
  });
test("auto prioritizes fewer games, excludes resting players and never repeats a player", () => {
  const ps = players([8, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  ps[1].available = false;
  const ms = autoPair(ps, 2, () => 0.5);
  const ids = ms.flatMap((m) => [...m.a, ...m.b]);
  assert.equal(new Set(ids).size, 8);
  assert.ok(!ids.includes(1));
  assert.ok(!ids.includes(2));
});
test("skill pairing minimizes the difference of team totals inside a court", () => {
  const ps = players([0, 0, 0, 0]);
  ps.forEach((p, i) => (p.level = [5, 4, 2, 1][i]));
  const [m] = autoPair(ps, 1, () => 0.5);
  const level = (id) => ps.find((p) => p.id === id).level;
  assert.equal(
    m.a.reduce((s, id) => s + level(id), 0),
    6,
  );
  assert.equal(
    m.b.reduce((s, id) => s + level(id), 0),
    6,
  );
});
test("a game increments exactly four participants, and finished games do not increment again", () => {
  const ps = players([0, 0, 0, 0, 0]);
  const m = { id: 1, a: [1, 2], b: [3, 4], done: false };
  const next = completeMatch(ps, m);
  assert.deepEqual(
    next.map((p) => p.games),
    [1, 1, 1, 1, 0],
  );
  assert.equal(completeMatch(next, { ...m, done: true }), next);
});
test("invalid duplicate custom teams and insufficient players fail", () => {
  assert.throws(() =>
    completeMatch(players([0, 0, 0, 0]), {
      id: 1,
      a: [1, 2],
      b: [2, 4],
      done: false,
    }),
  );
  assert.throws(() => autoPair(players([0, 0, 0]), 1));
});
test("negative or fractional game counts and invalid costs fail", () => {
  const f = fixtures[0];
  assert.throws(() => calculateBill(players([-1, 1]), f.costs));
  assert.throws(() => calculateBill(players([1.5, 1]), f.costs));
  assert.throws(() =>
    calculateBill(players([1, 1]), { ...f.costs, shuttleCostCents: -1 }),
  );
});
test("no games means no accidental equal split", () => {
  const b = calculateBill(players([0, 0]), fixtures[0].costs);
  assert.equal(b.totalGames, 0);
  assert.deepEqual(
    b.rows.map((p) => p.cents),
    [0, 0],
  );
});
test("arbitrary weighted splits reconcile exactly and keep non-players at zero", () => {
  for (let total = 1; total < 300; total++) {
    const b = calculateBill(players([3, 1, 7, 0, 2]), {
      minutes: 0,
      courts: 1,
      courtRateCents: 0,
      shuttleCostCents: total,
      extras: [],
    });
    assert.equal(
      b.rows.reduce((s, p) => s + p.cents, 0),
      total,
    );
    assert.equal(b.rows[3].cents, 0);
  }
});
test("editing a name and level preserves identity and completed games", () => {
  const ps = players([3, 2, 0, 0]);
  const next = updatePlayer(ps, 1, "  ชื่อใหม่  ", 5);
  assert.deepEqual(next[0], { ...ps[0], name: "ชื่อใหม่", level: 5 });
  assert.equal(next[0].games, 3);
  assert.equal(ps[0].name, "คน1");
  assert.throws(() => updatePlayer(ps, 1, "คน2", 3));
  assert.throws(() => updatePlayer(ps, 1, "   ", 3));
  assert.throws(() => updatePlayer(ps, 1, "ใหม่", 6));
});
test("avatar changes preserve player identity, games and bill shares through a completed match", () => {
  const ps = players([3, 2, 0, 0]);
  const next = updatePlayer(ps, 1, ps[0].name, ps[0].level, 8);
  assert.equal(playerAvatar(next[0]), 8);
  assert.equal(playerAvatar(ps[1]), 1);
  assert.equal(next[0].id, ps[0].id);
  assert.equal(next[0].games, ps[0].games);
  assert.equal(next[1], ps[1]);
  assert.equal(ps[0].avatar, undefined);
  const costs = {
    minutes: 60,
    courts: 1,
    courtRateCents: 18000,
    shuttleCostCents: 9000,
    extras: [],
  };
  assert.deepEqual(calculateBill(next, costs), calculateBill(ps, costs));
  const played = completeMatch(next, {
    id: 1,
    a: [1, 2],
    b: [3, 4],
    done: false,
  });
  assert.equal(played[0].avatar, 8);
  assert.equal(played[0].games, 4);
  assert.equal(updatePlayer(played, 1, "เปลี่ยนชื่อ", 4)[0].avatar, 8);
  for (const invalid of [-1, 0.5, avatarNames.length, NaN]) {
    assert.throws(() => updatePlayer(ps, 1, ps[0].name, 3, invalid));
  }
});
test("cancelling an unfinished court keeps completed courts and counters intact", () => {
  const ps = players([0, 0, 0, 0, 0, 0, 0, 0]);
  const first = { id: 1, a: [1, 2], b: [3, 4], done: false };
  const second = { id: 2, a: [5, 6], b: [7, 8], done: false };
  const played = completeMatch(ps, first);
  const remaining = cancelPendingMatch([{ ...first, done: true }, second], 2);
  assert.deepEqual(remaining, [{ ...first, done: true }]);
  assert.deepEqual(
    played.map((p) => p.games),
    [1, 1, 1, 1, 0, 0, 0, 0],
  );
  assert.throws(() => cancelPendingMatch(remaining, 1));
  assert.throws(() => cancelPendingMatch(remaining, 2));
});
test("changing a pending lineup counts only its confirmed replacement players", () => {
  const ps = players([0, 0, 0, 0, 0]);
  const ms = [{ id: 1, a: [1, 2], b: [3, 4], done: false }];
  const [changed] = replacePendingMatch(ps, ms, 1, [1, 2, 3, 5]);
  assert.deepEqual(
    completeMatch(ps, changed).map((p) => p.games),
    [1, 1, 1, 0, 1],
  );
  assert.deepEqual(ms[0].b, [3, 4]);
  assert.throws(() =>
    replacePendingMatch(ps, [{ ...ms[0], done: true }], 1, [1, 2, 3, 5]),
  );
  assert.throws(() => replacePendingMatch(ps, ms, 1, [1, 2, 2, 5]));
  assert.throws(() => replacePendingMatch(ps, ms, 1, [1, 2, 3, 99]));
});
test("one player cannot be put on two unfinished courts", () => {
  const ps = players(Array(8).fill(0));
  const first = { id: 1, a: [1, 2], b: [3, 4], done: false };
  const second = { id: 2, a: [5, 6], b: [7, 8], done: false };
  assert.throws(() =>
    replacePendingMatch(ps, [first, second], 1, [1, 2, 3, 5]),
  );
  assert.deepEqual(
    replacePendingMatch(
      ps,
      [first, { ...second, done: true }],
      1,
      [1, 2, 3, 5],
    )[0].b,
    [3, 5],
  );
});
test("visible game price is 270 / 4 = 67.50 baht per player-game", () => {
  const f = fixtures.find((f) => f.total === 27000);
  const b = calculateBill(players(f.games), f.costs);
  assert.equal(gameRate(b), 6750);
  assert.equal(b.totalGames, 4);
  assert.equal(
    b.rows.reduce((s, p) => s + p.cents, 0),
    27000,
  );
  assert.equal(gameRate({ totalCents: 27000, totalGames: 0 }), 0);
});
