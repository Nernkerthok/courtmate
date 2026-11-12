import { avatarNames, MAX_PLAYERS, type Match, type Player } from "./domain.js";

export type Played = { id: number; round: number; match: Match };
export type CostFields = {
  hours: string;
  courts: string;
  rate: string;
  shuttle: string;
};
export type CourtSnapshot = {
  version: 1;
  groupName: string;
  players: Player[];
  matches: Match[];
  history: Played[];
  round: number;
  mode: "auto" | "custom";
  courts: number;
  costFields: CostFields;
  extras: { id: number; name: string; amount: string }[];
  step: "group" | "play" | "cost";
};

const invalid = () => {
  throw new Error("ข้อมูลก๊วนไม่สมบูรณ์ กรุณาตรวจรายชื่อ เกม และค่าใช้จ่าย");
};
export const snapshotFingerprint = (snapshot: CourtSnapshot | null) =>
  snapshot ? JSON.stringify({ ...snapshot, step: "group" }) : "";
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return invalid();
  return v as Record<string, unknown>;
};
const integer = (v: unknown, min = 0, max = 10000): number => {
  if (typeof v !== "number" || !Number.isSafeInteger(v) || v < min || v > max)
    return invalid();
  return v;
};
const text = (v: unknown, max: number): string => {
  if (typeof v !== "string" || !v.trim() || v.length > max) return invalid();
  return v.trim();
};
const list = (v: unknown, max: number): unknown[] => {
  if (!Array.isArray(v) || v.length > max) return invalid();
  return v;
};
const decimal = (v: unknown, max: number): string => {
  if (
    typeof v !== "string" ||
    !/^\d+(?:\.\d{1,2})?$/.test(v) ||
    Number(v) > max
  )
    return invalid();
  return v;
};

// Rebuild from allowed fields: persisted data is input, never trusted application state.
export function parseSnapshot(input: unknown): CourtSnapshot {
  const data = record(input);
  if (data.version !== 1)
    throw new Error("เวอร์ชันข้อมูลนี้ยังไม่รองรับ กรุณาอัปเดตแอป");
  const players: Player[] = list(data.players, MAX_PLAYERS).map((raw) => {
    const p = record(raw);
    if (typeof p.available !== "boolean") return invalid();
    return {
      id: integer(p.id, 1, 2147483647),
      name: text(p.name, 40),
      level: integer(p.level, 1, 5),
      games: integer(p.games),
      available: p.available,
      ...(p.avatar === undefined
        ? {}
        : { avatar: integer(p.avatar, 0, avatarNames.length - 1) }),
    };
  });
  if (
    new Set(players.map((p) => p.id)).size !== players.length ||
    new Set(players.map((p) => p.name.toLocaleLowerCase())).size !==
      players.length
  )
    return invalid();
  const ids = new Set(players.map((p) => p.id));
  const match = (raw: unknown): Match => {
    const m = record(raw);
    const a = list(m.a, 2).map((id) => integer(id, 1, 2147483647));
    const b = list(m.b, 2).map((id) => integer(id, 1, 2147483647));
    if (
      a.length !== 2 ||
      b.length !== 2 ||
      new Set([...a, ...b]).size !== 4 ||
      [...a, ...b].some((id) => !ids.has(id)) ||
      typeof m.done !== "boolean"
    )
      return invalid();
    return {
      id: integer(m.id, 1, 5),
      a: a as [number, number],
      b: b as [number, number],
      done: m.done,
    };
  };
  const round = integer(data.round);
  const matches = list(data.matches, 5).map(match);
  if (
    new Set(matches.map((m) => m.id)).size !== matches.length ||
    (matches.length && !round)
  )
    return invalid();
  const activeIds = matches
    .filter((m) => !m.done)
    .flatMap((m) => [...m.a, ...m.b]);
  if (new Set(activeIds).size !== activeIds.length) return invalid();
  const history: Played[] = list(data.history, 10000).map((raw) => {
    const h = record(raw);
    const played = match(h.match);
    if (!played.done) return invalid();
    return {
      id: integer(h.id, 1, Number.MAX_SAFE_INTEGER),
      round: integer(h.round, 1, round),
      match: played,
    };
  });
  if (
    new Set(history.map((h) => h.id)).size !== history.length ||
    new Set(history.map((h) => `${h.round}:${h.match.id}`)).size !==
      history.length
  )
    return invalid();
  const counts = new Map(players.map((p) => [p.id, 0]));
  for (const h of history)
    for (const id of [...h.match.a, ...h.match.b])
      counts.set(id, counts.get(id)! + 1);
  if (players.some((p) => p.games !== counts.get(p.id))) return invalid();
  for (const m of matches.filter((m) => m.done)) {
    const saved = history.find(
      (h) => h.round === round && h.match.id === m.id,
    )?.match;
    if (!saved || JSON.stringify(saved) !== JSON.stringify(m)) return invalid();
  }
  if (data.mode !== "auto" && data.mode !== "custom") return invalid();
  if (
    !["group", "play", "cost"].includes(String(data.step)) ||
    (data.step !== "group" && players.length < 4)
  )
    return invalid();
  const costs = record(data.costFields);
  const costFields = {
    hours: decimal(costs.hours, 24),
    courts: decimal(costs.courts, 20),
    rate: decimal(costs.rate, 1000000),
    shuttle: decimal(costs.shuttle, 1000000),
  };
  if (
    (Number(costFields.hours) * 4) % 1 ||
    !Number.isInteger(Number(costFields.courts)) ||
    Number(costFields.courts) < 1
  )
    return invalid();
  const extras = list(data.extras, 20).map((raw) => {
    const e = record(raw);
    return {
      id: integer(e.id, 1, Number.MAX_SAFE_INTEGER),
      name: text(e.name, 60),
      amount: decimal(e.amount, 1000000),
    };
  });
  if (new Set(extras.map((e) => e.id)).size !== extras.length) return invalid();
  const result: CourtSnapshot = {
    version: 1,
    groupName: text(data.groupName, 50),
    players,
    matches,
    history,
    round,
    mode: data.mode,
    courts: integer(data.courts, 1, 5),
    costFields,
    extras,
    step: data.step as CourtSnapshot["step"],
  };
  if (JSON.stringify(result).length > 1000000)
    throw new Error("ข้อมูลรอบนี้มีขนาดใหญ่เกินไป กรุณาเริ่มรอบใหม่");
  return result;
}
