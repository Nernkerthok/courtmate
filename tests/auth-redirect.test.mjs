import test from "node:test";
import assert from "node:assert/strict";
import {
  keepAuthDraft,
  takeAuthDraft,
  clearAuthDraft,
  authCallback,
  cleanAuthCallback,
} from "../.test-build/authRedirect.js";
import { authErrorMessage } from "../.test-build/authErrors.js";

const snapshot = {
  version: 1,
  groupName: "ก๊วนกลับจาก Google",
  step: "play",
  mode: "custom",
  courts: 1,
  round: 1,
  players: Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    name: `คน ${i + 1}`,
    level: i + 1,
    games: 0,
    available: true,
    avatar: i + 8,
  })),
  matches: [{ id: 1, a: [1, 2], b: [3, 4], done: false }],
  history: [],
  costFields: { hours: "2.5", courts: "1", rate: "180", shuttle: "90" },
  extras: [{ id: 1, name: "น้ำ", amount: "40" }],
};
function storage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}
test("Google round trip keeps roster, icons, pending court and costs once in its own tab", () => {
  const originalTab = storage();
  const otherTab = storage();
  keepAuthDraft(
    originalTab,
    { ...snapshot, provider_token: "NEVER_STORE" },
    1000,
  );
  assert.equal(takeAuthDraft(otherTab, 2000), null);
  assert.ok(![...originalTab.data.values()][0].includes("NEVER_STORE"));
  assert.deepEqual(takeAuthDraft(originalTab, 2000), { snapshot });
  assert.equal(takeAuthDraft(originalTab, 2000), null);
  assert.equal(originalTab.data.size, 0);
});
test("temporary sign-in drafts expire, can be cleared and reject corrupt or hostile payloads", () => {
  const tab = storage();
  keepAuthDraft(tab, snapshot, 1000);
  assert.equal(takeAuthDraft(tab, 1000 + 30 * 60 * 1000 + 1), null);
  keepAuthDraft(tab, snapshot, 1000);
  assert.equal(takeAuthDraft(tab, 999), null);
  keepAuthDraft(tab, snapshot, 1000);
  clearAuthDraft(tab);
  assert.equal(takeAuthDraft(tab, 2000), null);
  for (const raw of [
    "{",
    "null",
    JSON.stringify({
      version: 1,
      createdAt: 1000,
      snapshot: {
        ...snapshot,
        players: [{ ...snapshot.players[0], games: 99 }],
      },
    }),
    "x".repeat(1000001),
  ]) {
    tab.setItem("courtmate.auth-draft.v1", raw);
    assert.equal(takeAuthDraft(tab, 2000), null);
    assert.equal(tab.data.size, 0);
  }
  const blocked = {
    getItem() {
      throw new Error("blocked");
    },
    removeItem() {},
    setItem() {
      throw new Error("quota");
    },
  };
  assert.equal(takeAuthDraft(blocked), null);
  assert.throws(() => keepAuthDraft(blocked, snapshot));
});
test("sign-in from the empty state remembers the return without inventing a group", () => {
  const tab = storage();
  keepAuthDraft(tab, null, 1000);
  assert.deepEqual(takeAuthDraft(tab, 2000), { snapshot: null });
});
test("OAuth cancellation is actionable and callback codes/errors are removed without copying raw messages", () => {
  const url =
    "https://courtmate.example/?v=1&error=access_denied&error_description=PRIVATE_PROVIDER_DETAIL";
  assert.deepEqual(authCallback(url), {
    returning: true,
    error: "access_denied",
  });
  assert.match(authErrorMessage({ code: authCallback(url).error }), /ยกเลิก/);
  assert.equal(cleanAuthCallback(url), "https://courtmate.example/?v=1");
  assert.equal(
    cleanAuthCallback("https://courtmate.example/?code=SECRET#invite=keep"),
    "https://courtmate.example/#invite=keep",
  );
  assert.equal(
    cleanAuthCallback(
      "https://courtmate.example/#error=access_denied&error_description=PRIVATE",
    ),
    "https://courtmate.example/",
  );
  assert.deepEqual(authCallback("https://courtmate.example/?code=SECRET"), {
    returning: true,
    error: null,
  });
  assert.deepEqual(authCallback("https://courtmate.example/"), {
    returning: false,
    error: null,
  });
});
