import test from "node:test";
import assert from "node:assert/strict";
import { parseSnapshot, snapshotFingerprint } from "../.test-build/snapshot.js";
import { calculateBill } from "../.test-build/domain.js";

const fixture = () => ({
  version: 1,
  groupName: "ก๊วนหลังเลิกงาน",
  step: "cost",
  mode: "auto",
  courts: 1,
  round: 1,
  players: Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    name: `คน${i + 1}`,
    level: i + 1,
    available: true,
    games: 1,
    avatar: 8 + i,
  })),
  matches: [{ id: 1, a: [1, 4], b: [2, 3], done: true }],
  history: [
    { id: 7, round: 1, match: { id: 1, a: [1, 4], b: [2, 3], done: true } },
  ],
  costFields: { hours: "1", courts: "1", rate: "180", shuttle: "90" },
  extras: [],
});
test("cloud snapshot restores icons, finished/pending games and exact bill shares", () => {
  const source = fixture();
  const saved = parseSnapshot(JSON.parse(JSON.stringify(source)));
  assert.deepEqual(saved, source);
  const bill = calculateBill(saved.players, {
    minutes: 60,
    courts: 1,
    courtRateCents: 18000,
    shuttleCostCents: 9000,
    extras: [],
  });
  assert.equal(bill.totalGames, 4);
  assert.deepEqual(
    bill.rows.map((row) => row.cents),
    [6750, 6750, 6750, 6750],
  );
  source.matches[0].done = false;
  source.history = [];
  source.players.forEach((p) => (p.games = 0));
  assert.deepEqual(parseSnapshot(source), source);
});
test("opening a different screen does not mark a saved group dirty, changing a player does", () => {
  const source = fixture();
  assert.equal(
    snapshotFingerprint(source),
    snapshotFingerprint({ ...source, step: "group" }),
  );
  const changed = fixture();
  changed.players[0].avatar = 1;
  assert.notEqual(snapshotFingerprint(source), snapshotFingerprint(changed));
});
test("invalid imported snapshots are rejected before replacing current state", () => {
  for (const mutate of [
    (s) => (s.version = 2),
    (s) => (s.players[0].id = 2),
    (s) => (s.players[0].games = 100),
    (s) => (s.players[0].avatar = 12),
    (s) => (s.matches[0].b = [1, 2]),
    (s) => (s.history[0].match.a = [1, 99]),
    (s) => (s.history[0].match.done = false),
    (s) => s.history.push(s.history[0]),
    (s) => (s.costFields.hours = "Infinity"),
    (s) => (s.costFields.rate = "-1"),
    (s) => (s.costFields.hours = "0.1"),
    (s) => (s.players[0].name = ""),
    (s) => (s.groupName = " "),
    (s) => (s.players[0].available = "true"),
    (s) => (s.matches[0].a = [2, 3]),
    (s) => (s.extras = [{ id: 1, name: "น้ำ", amount: "1000001" }]),
  ]) {
    const saved = fixture();
    mutate(saved);
    assert.throws(() => parseSnapshot(saved));
  }
});
test("empty rosters can be saved and unknown fields cannot become application state", () => {
  const saved = {
    ...fixture(),
    step: "group",
    players: [],
    matches: [],
    history: [],
    round: 0,
    owner_id: "other",
    secret: "ignored",
  };
  const parsed = parseSnapshot(saved);
  assert.equal(parsed.players.length, 0);
  assert.equal(parsed.owner_id, undefined);
  assert.equal(parsed.secret, undefined);
});
