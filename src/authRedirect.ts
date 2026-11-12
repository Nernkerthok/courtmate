import { parseSnapshot, type CourtSnapshot } from "./snapshot.js";

const key = "courtmate.auth-draft.v1";
const lifetime = 30 * 60 * 1000;
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Only an explicit sign-in keeps a tab-scoped draft; it is consumed once on return.
export function keepAuthDraft(
  storage: DraftStorage,
  snapshot: CourtSnapshot | null,
  now = Date.now(),
) {
  storage.setItem(
    key,
    JSON.stringify({
      version: 1,
      createdAt: now,
      snapshot: snapshot ? parseSnapshot(snapshot) : null,
    }),
  );
}

export function clearAuthDraft(storage: DraftStorage) {
  storage.removeItem(key);
}

export function takeAuthDraft(
  storage: DraftStorage,
  now = Date.now(),
): { snapshot: CourtSnapshot | null } | null {
  try {
    const raw = storage.getItem(key);
    storage.removeItem(key);
    if (!raw || raw.length > 1000000) return null;
    const draft = JSON.parse(raw);
    if (
      draft?.version !== 1 ||
      !Number.isSafeInteger(draft.createdAt) ||
      now < draft.createdAt ||
      now - draft.createdAt > lifetime
    )
      return null;
    return {
      snapshot: draft.snapshot === null ? null : parseSnapshot(draft.snapshot),
    };
  } catch {
    return null;
  }
}

export function authCallback(url: string) {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.slice(1));
  const error =
    parsed.searchParams.get("error_code") ||
    hash.get("error_code") ||
    parsed.searchParams.get("error") ||
    hash.get("error");
  return {
    returning: parsed.searchParams.has("code") || Boolean(error),
    error,
  };
}

export function cleanAuthCallback(url: string): string {
  const parsed = new URL(url);
  for (const name of ["code", "error", "error_code", "error_description"]) {
    parsed.searchParams.delete(name);
  }
  const hash = new URLSearchParams(parsed.hash.slice(1));
  if (
    ["error", "error_code", "error_description"].some((name) => hash.has(name))
  ) {
    parsed.hash = "";
  }
  return parsed.href;
}
