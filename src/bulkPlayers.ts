import { MAX_PLAYERS, type Player } from "./domain.js";

const nameKey = (name: string) =>
  name.trim().normalize("NFC").toLocaleLowerCase();
const examples = (names: Set<string>) =>
  [...names].slice(0, 3).join(", ") + (names.size > 3 ? " และชื่ออื่น ๆ" : "");

export function reviewBulkNames(players: Player[], raw: string) {
  if (raw.length > 5000)
    return { names: [], errors: ["รายชื่อยาวเกินไป กรุณาแบ่งเพิ่มเป็นชุด"] };
  const names = raw
    .split(/[\r\n,，;]+/u)
    .map((name) => name.trim().normalize("NFC"))
    .filter(Boolean);
  const errors: string[] = [];
  if (!names.length) errors.push("กรอกชื่อผู้เล่นอย่างน้อย 1 คน");
  if (names.some((name) => name.length > 40))
    errors.push("แต่ละชื่อยาวได้ไม่เกิน 40 ตัวอักษร");
  const existing = new Set(players.map((p) => nameKey(p.name)));
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const name of names) {
    const key = nameKey(name);
    if (existing.has(key) || seen.has(key)) duplicates.add(name);
    seen.add(key);
  }
  if (duplicates.size)
    errors.push(`มีชื่อซ้ำในก๊วนหรือในชุดนี้: ${examples(duplicates)}`);
  if (players.length + names.length > MAX_PLAYERS)
    errors.push(
      `ก๊วนมีได้สูงสุด ${MAX_PLAYERS} คน ตอนนี้เพิ่มได้อีก ${Math.max(0, MAX_PLAYERS - players.length)} คน`,
    );
  return { names, errors };
}

export function buildBulkPlayers(
  players: Player[],
  raw: string,
  level: number,
  nextId: number,
): Player[] {
  const review = reviewBulkNames(players, raw);
  if (review.errors.length) throw new Error(review.errors[0]);
  if (!Number.isInteger(level) || level < 1 || level > 5)
    throw new Error("เลือก Level 1–5 อีกครั้ง");
  if (
    !Number.isSafeInteger(nextId) ||
    nextId < 1 ||
    nextId + review.names.length - 1 > 2147483647 ||
    players.some((p) => p.id >= nextId && p.id < nextId + review.names.length)
  )
    throw new Error("เพิ่มผู้เล่นไม่สำเร็จ กรุณาลองใหม่");
  return review.names.map((name, index) => ({
    id: nextId + index,
    name,
    level,
    games: 0,
    available: true,
    avatar: (nextId + index - 1) % 8,
  }));
}
