import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInviteUrl,
  parseInviteHash,
  lineInvitation,
  parsePublicRoster,
} from "../.test-build/invites.js";
const key = {
  groupId: "11111111-1111-4111-8111-111111111111",
  token: "a".repeat(64),
};
test("invite token stays in the URL fragment and auth query parameters never reach LINE", () => {
  const url = buildInviteUrl(
    "https://courtmate.example/?code=PRIVATE_AUTH_CODE",
    key,
  );
  assert.equal(new URL(url).search, "");
  assert.deepEqual(parseInviteHash(new URL(url).hash), key);
  assert.equal(parseInviteHash("#invite=guess.bad"), null);
  assert.throws(() => buildInviteUrl("javascript:alert(1)", key));
  const { href, message } = lineInvitation("ก๊วน & เพื่อน", url);
  assert.equal(new URL(href).origin, "https://line.me");
  assert.equal(new URL(href).searchParams.get("text"), message);
  assert.ok(message.includes("ก๊วน & เพื่อน"));
  assert.ok(message.includes(url));
  assert.ok(!message.includes("PRIVATE_AUTH_CODE"));
});
test("public roster parser strips private fields and refuses malformed content", () => {
  const raw = {
    groupName: "ก๊วน A",
    updated_at: "2026-11-12T10:00:00Z",
    ownerEmail: "private",
    costFields: { rate: 180 },
    players: [{ id: 1, name: "ต้น", level: 3, avatar: 8, games: 5 }],
  };
  const view = parsePublicRoster(raw);
  assert.equal(view.ownerEmail, undefined);
  assert.equal(view.costFields, undefined);
  assert.equal(view.players[0].games, undefined);
  assert.throws(() => parsePublicRoster(null));
  assert.throws(() =>
    parsePublicRoster({ ...raw, players: [{ ...raw.players[0], avatar: 99 }] }),
  );
  assert.throws(() =>
    parsePublicRoster({ ...raw, players: [raw.players[0], raw.players[0]] }),
  );
});
