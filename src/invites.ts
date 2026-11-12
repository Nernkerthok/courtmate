import { avatarNames, MAX_PLAYERS, type Player } from "./domain.js";

export type InviteKey = { groupId: string; token: string };
export type PublicRoster = {
  groupName: string;
  updated_at: string;
  players: Pick<Player, "id" | "name" | "level" | "avatar">[];
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function parseInviteHash(hash: string): InviteKey | null {
  const match = /^#invite=([a-f0-9-]+)\.([a-f0-9]{64})$/.exec(hash);
  return match && uuid.test(match[1])
    ? { groupId: match[1], token: match[2] }
    : null;
}
export function buildInviteUrl(base: string, key: InviteKey): string {
  const url = new URL(base);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    !uuid.test(key.groupId) ||
    !/^[a-f0-9]{64}$/.test(key.token)
  )
    throw new Error("ลิงก์เชิญไม่ถูกต้อง");
  url.search = "";
  url.hash = `invite=${key.groupId}.${key.token}`;
  return url.href;
}
export function lineInvitation(groupName: string, url: string) {
  const message = `ชวนมาตีแบดด้วยกัน!\nก๊วน ${groupName}\nดูรายชื่อและ Level ได้ที่ลิงก์นี้\n${url}\nสนใจร่วมเล่น ทักผู้จัดก๊วนในแชตนี้ได้เลย`;
  return {
    message,
    href: `https://line.me/R/share?text=${encodeURIComponent(message)}`,
  };
}
export function parsePublicRoster(value: unknown): PublicRoster {
  const invalid = () => {
    throw new Error("ลิงก์นี้ไม่พร้อมใช้งาน อาจหมดอายุหรือถูกปิดแล้ว");
  };
  if (!value || typeof value !== "object") return invalid();
  const v = value as Record<string, unknown>;
  if (
    typeof v.groupName !== "string" ||
    !v.groupName.trim() ||
    v.groupName.length > 50 ||
    typeof v.updated_at !== "string" ||
    !Number.isFinite(Date.parse(v.updated_at)) ||
    !Array.isArray(v.players) ||
    v.players.length > MAX_PLAYERS
  )
    return invalid();
  const players = v.players.map((raw) => {
    if (!raw || typeof raw !== "object") return invalid();
    const p = raw as Record<string, unknown>;
    if (
      typeof p.id !== "number" ||
      !Number.isSafeInteger(p.id) ||
      p.id < 1 ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 40 ||
      typeof p.level !== "number" ||
      !Number.isInteger(p.level) ||
      p.level < 1 ||
      p.level > 5 ||
      (p.avatar != null &&
        (typeof p.avatar !== "number" ||
          !Number.isInteger(p.avatar) ||
          p.avatar < 0 ||
          p.avatar >= avatarNames.length))
    )
      return invalid();
    return {
      id: p.id,
      name: p.name,
      level: p.level,
      ...(p.avatar == null ? {} : { avatar: p.avatar as number }),
    };
  });
  if (new Set(players.map((p) => p.id)).size !== players.length)
    return invalid();
  return { groupName: v.groupName, updated_at: v.updated_at, players };
}
