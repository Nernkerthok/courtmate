import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBulkPlayers,
  reviewBulkNames,
} from "../.test-build/bulkPlayers.js";
import { calculateBill, MAX_PLAYERS } from "../.test-build/domain.js";

test("bulk names support pasted lines, commas and empty separators while keeping spaces in a name", () => {
  const added = buildBulkPlayers(
    [],
    " ต้น\r\n\r\nมิน, ฟ้า，เจมส์; นัท 2 ",
    2,
    10,
  );
  assert.deepEqual(
    added.map((p) => p.name),
    ["ต้น", "มิน", "ฟ้า", "เจมส์", "นัท 2"],
  );
  assert.deepEqual(
    added.map((p) => p.id),
    [10, 11, 12, 13, 14],
  );
  assert.ok(
    added.every(
      (p) =>
        p.games === 0 &&
        p.available &&
        p.level === 2 &&
        p.avatar >= 0 &&
        p.avatar < 8,
    ),
  );
});
test("a duplicate existing name, duplicate batch name or invalid level rejects the entire batch", () => {
  const existing = [
    { id: 1, name: "Min", games: 2, available: false, level: 3, avatar: 10 },
  ];
  const before = structuredClone(existing);
  for (const text of [
    "มิน\n min ",
    "ต้น,ต้น",
    "Café\nCafe\u0301",
    " ",
    "ก".repeat(41),
    "x".repeat(5001),
  ]) {
    assert.throws(() => buildBulkPlayers(existing, text, 3, 2));
    assert.deepEqual(existing, before);
  }
  for (const level of [0, 6, 2.5, NaN])
    assert.throws(() => buildBulkPlayers(existing, "ต้น", level, 2));
  assert.throws(() => buildBulkPlayers(existing, "ต้น", 2, 1));
  assert.throws(() => buildBulkPlayers(existing, "ต้น,ฟ้า", 2, 2147483647));
});
test("bulk additions respect the 40-player limit without dropping overflow names", () => {
  const existing = Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => ({
    id: i + 1,
    name: `ผู้เล่น${i + 1}`,
    games: 0,
    available: true,
    level: 1,
  }));
  assert.equal(buildBulkPlayers(existing, "คนสุดท้าย", 3, 40).length, 1);
  assert.throws(
    () => buildBulkPlayers(existing, "คนใหม่1\nคนใหม่2", 3, 40),
    /อีก 1 คน/,
  );
  assert.equal(existing.length, 39);
  assert.match(
    reviewBulkNames(existing, "คนใหม่1\nคนใหม่2").errors.join(),
    /40/,
  );
});
test("new zero-game players do not change completed players, rest status or their bill shares", () => {
  const existing = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    name: `ผู้เล่น${i + 1}`,
    games: 1,
    available: i !== 0,
    level: i + 1,
    avatar: i + 8,
  }));
  const before = structuredClone(existing);
  const added = buildBulkPlayers(existing, "เพื่อนใหม่1,เพื่อนใหม่2", 3, 5);
  const costs = {
    minutes: 60,
    courts: 1,
    courtRateCents: 18000,
    shuttleCostCents: 9000,
    extras: [],
  };
  const bill = calculateBill([...existing, ...added], costs);
  assert.deepEqual(existing, before);
  assert.deepEqual(
    bill.rows.map((p) => p.cents),
    [6750, 6750, 6750, 6750, 0, 0],
  );
});
