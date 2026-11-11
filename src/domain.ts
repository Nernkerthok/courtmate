export type Player = {
  id: number;
  name: string;
  level: number;
  games: number;
  available: boolean;
};
export type Match = {
  id: number;
  a: [number, number];
  b: [number, number];
  done: boolean;
};
export type CostInput = {
  minutes: number;
  courts: number;
  courtRateCents: number;
  shuttleCostCents: number;
  extras: { name: string; cents: number }[];
};
export type Bill = {
  totalCents: number;
  courtCents: number;
  totalGames: number;
  rows: { id: number; name: string; games: number; cents: number }[];
};
export const levelNames = [
  "",
  "เริ่มต้น",
  "พื้นฐาน",
  "กลาง",
  "คล่อง",
  "แข่งขัน",
];
export const MAX_PLAYERS = 40;
export function autoPair(
  players: Player[],
  courts: number,
  random = Math.random,
): Match[] {
  const available = players.filter((p) => p.available);
  if (
    !Number.isInteger(courts) ||
    courts < 1 ||
    courts > 5 ||
    available.length < courts * 4
  )
    throw new Error("จำนวนผู้เล่นไม่พอสำหรับคอร์ทที่เลือก");
  const ranked = available
    .map((p) => ({ p, tie: random() }))
    .sort((a, b) => a.p.games - b.p.games || a.tie - b.tie)
    .slice(0, courts * 4)
    .map((x) => x.p);
  // Participation first; balance skill within each court. This does not equate playing time.
  return Array.from({ length: courts }, (_, i) => {
    const four = ranked
      .slice(i * 4, i * 4 + 4)
      .sort((a, b) => b.level - a.level);
    return {
      id: i + 1,
      a: [four[0].id, four[3].id],
      b: [four[1].id, four[2].id],
      done: false,
    };
  });
}
export function completeMatch(players: Player[], match: Match): Player[] {
  if (match.done) return players;
  const ids = [...match.a, ...match.b];
  if (
    new Set(ids).size !== 4 ||
    ids.some((id) => !players.some((p) => p.id === id))
  )
    throw new Error("ผู้เล่นในคอร์ทต้องเป็นคนละคนและอยู่ในกลุ่ม");
  return players.map((p) =>
    ids.includes(p.id) ? { ...p, games: p.games + 1 } : p,
  );
}
export function updatePlayer(
  players: Player[],
  id: number,
  name: string,
  level: number,
): Player[] {
  const value = name.trim();
  if (!players.some((p) => p.id === id)) throw new Error("ไม่พบผู้เล่นนี้");
  if (
    !value ||
    value.length > 40 ||
    !Number.isInteger(level) ||
    level < 1 ||
    level > 5
  )
    throw new Error("ตรวจชื่อและ Level อีกครั้ง");
  if (
    players.some(
      (p) =>
        p.id !== id && p.name.toLocaleLowerCase() === value.toLocaleLowerCase(),
    )
  )
    throw new Error("มีชื่อนี้แล้ว ลองเติมชื่อเล่นหรือหมายเลข");
  return players.map((p) => (p.id === id ? { ...p, name: value, level } : p));
}
export function cancelPendingMatch(matches: Match[], id: number): Match[] {
  const match = matches.find((m) => m.id === id);
  if (!match || match.done)
    throw new Error("ยกเลิกได้เฉพาะคอร์ทที่ยังไม่จบเกม");
  return matches.filter((m) => m.id !== id);
}
export function replacePendingMatch(
  players: Player[],
  matches: Match[],
  id: number,
  ids: number[],
): Match[] {
  const match = matches.find((m) => m.id === id);
  if (!match || match.done)
    throw new Error("แก้คู่ได้เฉพาะคอร์ทที่ยังไม่จบเกม");
  if (
    ids.length !== 4 ||
    new Set(ids).size !== 4 ||
    ids.some((pid) => !players.some((p) => p.id === pid))
  )
    throw new Error("เลือกผู้เล่น 4 คนให้ครบและไม่ซ้ำกัน");
  const occupied = matches
    .filter((m) => m.id !== id && !m.done)
    .flatMap((m) => [...m.a, ...m.b]);
  if (ids.some((pid) => occupied.includes(pid)))
    throw new Error("ผู้เล่นคนนี้อยู่ในอีกคอร์ทที่ยังไม่จบเกม");
  return matches.map((m) =>
    m.id === id ? { ...m, a: [ids[0], ids[1]], b: [ids[2], ids[3]] } : m,
  );
}
export function gameRate(bill: Pick<Bill, "totalCents" | "totalGames">) {
  return bill.totalGames > 0 ? bill.totalCents / bill.totalGames : 0;
}
export function calculateBill(
  players: Pick<Player, "id" | "name" | "games">[],
  costs: CostInput,
): Bill {
  if (
    players.length < 1 ||
    players.length > MAX_PLAYERS ||
    new Set(players.map((p) => p.id)).size !== players.length ||
    players.some(
      (p) => !Number.isInteger(p.games) || p.games < 0 || p.games > 10000,
    )
  )
    throw new Error("จำนวนเกมไม่ถูกต้อง");
  if (
    !Number.isInteger(costs.minutes) ||
    costs.minutes < 0 ||
    costs.minutes > 1440 ||
    !Number.isInteger(costs.courts) ||
    costs.courts < 1 ||
    costs.courts > 20 ||
    costs.extras.length > 20
  )
    throw new Error("เวลาและจำนวนคอร์ทไม่ถูกต้อง");
  if (
    [
      costs.courtRateCents,
      costs.shuttleCostCents,
      ...costs.extras.map((e) => e.cents),
    ].some((n) => !Number.isSafeInteger(n) || n < 0 || n > 100000000)
  )
    throw new Error("ค่าใช้จ่ายต้องเป็นจำนวนบวกหรือศูนย์");
  const courtCents = Math.round(
    (costs.minutes * costs.courts * costs.courtRateCents) / 60,
  );
  const totalCents =
    courtCents +
    costs.shuttleCostCents +
    costs.extras.reduce((s, e) => s + e.cents, 0);
  const totalGames = players.reduce((s, p) => s + p.games, 0);
  if (totalGames === 0)
    return {
      totalCents,
      courtCents,
      totalGames,
      rows: players.map((p) => ({
        id: p.id,
        name: p.name,
        games: p.games,
        cents: 0,
      })),
    };
  // Largest remainder allocation keeps the exact total, including every satang.
  const allocations = players.map((p, index) => ({
    index,
    cents: Math.floor((totalCents * p.games) / totalGames),
    remainder: (totalCents * p.games) % totalGames,
  }));
  let remaining = totalCents - allocations.reduce((s, r) => s + r.cents, 0);
  const priority = [...allocations].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );
  for (const row of priority) {
    if (remaining <= 0) break;
    row.cents++;
    remaining--;
  }
  return {
    totalCents,
    courtCents,
    totalGames,
    rows: players.map((p, i) => ({
      id: p.id,
      name: p.name,
      games: p.games,
      cents: allocations[i].cents,
    })),
  };
}
export const baht = (cents: number) =>
  (cents / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
