import { baht, gameRate, type Bill, type CostInput } from "./domain";
export async function createBillImage(
  name: string,
  bill: Bill,
  costs: CostInput,
): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  const lineItems = [
    ["ค่าสนาม", bill.courtCents] as const,
    ["ค่าลูกแบด", costs.shuttleCostCents] as const,
    ...costs.extras.map((e) => [e.name, e.cents] as const),
  ];
  const width = 720;
  const height =
    760 +
    lineItems.length * 44 +
    Math.ceil(lineItems.length / 3) * 28 +
    bill.rows.length * 56;
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("อุปกรณ์นี้ไม่รองรับการสร้างภาพ");
  ctx.scale(2, 2);
  ctx.fillStyle = "#f5faff";
  ctx.fillRect(0, 0, width, height);
  const header = ctx.createLinearGradient(0, 0, width, 200);
  header.addColorStop(0, "#0874d5");
  header.addColorStop(1, "#0055ee");
  ctx.fillStyle = header;
  ctx.fillRect(0, 0, width, 200);
  const text = (
    s: string,
    x: number,
    y: number,
    size = 22,
    color = "#111b38",
    bold = false,
  ) => {
    ctx.font = `${bold ? 600 : 400} ${size}px "IBM Plex Sans Thai", sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  };
  const right = (
    s: string,
    y: number,
    size = 22,
    color = "#111b38",
    bold = false,
  ) => {
    ctx.textAlign = "right";
    text(s, 668, y, size, color, bold);
    ctx.textAlign = "left";
  };
  const fit = (s: string, max: number) => {
    ctx.font = '400 22px "IBM Plex Sans Thai", sans-serif';
    let result = s;
    while (result.length > 0 && ctx.measureText(result).width > max)
      result = result.slice(0, -1);
    return result === s ? s : result + "…";
  };
  text("COURTMATE / สรุปค่าใช้จ่าย", 50, 54, 18, "#b8f1df", true);
  text(fit(name || "ก๊วนแบดมินตัน", 600), 50, 109, 30, "#fff", true);
  text(
    new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    50,
    158,
    18,
    "#d9eeff",
  );
  let y = 250;
  text("รายการค่าใช้จ่าย", 50, y, 22, "#111b38", true);
  y += 43;
  for (const [label, amount] of lineItems) {
    text(fit(label, 420), 50, y, 20, "#5c6c8d");
    right(`฿${baht(amount)}`, y, 20);
    y += 44;
  }
  ctx.strokeStyle = "#dce8f9";
  ctx.beginPath();
  ctx.moveTo(50, y - 17);
  ctx.lineTo(670, y - 17);
  ctx.stroke();
  text("รวมทั้งหมด", 50, y + 15, 22, "#111b38", true);
  right(`฿${baht(bill.totalCents)}`, y + 15, 28, "#075bd7", true);
  y += 62;
  const terms = lineItems
    .map(([, amount]) => amount)
    .filter((amount) => amount !== 0);
  const sum =
    (terms.length ? terms : [0]).map((amount) => baht(amount)).join(" + ") +
    ` = ${baht(bill.totalCents)} บาท`;
  ctx.font = '400 18px "IBM Plex Sans Thai", sans-serif';
  let equationLine = "";
  for (const word of sum.split(" ")) {
    const candidate = equationLine ? equationLine + " " + word : word;
    if (ctx.measureText(candidate).width > 615 && equationLine) {
      text(equationLine, 50, y, 18, "#5c6c8d");
      y += 28;
      equationLine = word;
    } else equationLine = candidate;
  }
  if (equationLine) {
    text(equationLine, 50, y, 18, "#5c6c8d");
    y += 32;
  }
  text(
    `${baht(bill.totalCents)} ÷ ${bill.totalGames} = ${baht(gameRate(bill))} บาท`,
    50,
    y,
    23,
    "#075bd7",
    true,
  );
  y += 31;
  text("ราคาเฉลี่ยต่อคนต่อเกม (ก่อนปัดเศษรายคน)", 50, y, 17, "#5c6c8d");
  y += 39;
  text(
    `หารตามจำนวนเกม · ผลรวมเกมของผู้เล่นทุกคน ${bill.totalGames}`,
    50,
    y,
    17,
    "#5c6c8d",
  );
  y += 38;
  ctx.fillStyle = "#dff0ff";
  ctx.fillRect(40, y - 26, 640, 45);
  text("ผู้เล่น", 55, y + 5, 18, "#101e49", true);
  ctx.textAlign = "center";
  text("เกม", 455, y + 5, 18, "#101e49", true);
  ctx.textAlign = "left";
  right("ยอดชำระ (บาท)", y + 5, 18, "#101e49", true);
  y += 56;
  for (const row of bill.rows) {
    text(fit(row.name, 340), 55, y, 21);
    ctx.textAlign = "center";
    text(String(row.games), 455, y, 21);
    ctx.textAlign = "left";
    right(baht(row.cents), y, 22, "#111b38", true);
    ctx.strokeStyle = "#e6eef9";
    ctx.beginPath();
    ctx.moveTo(50, y + 19);
    ctx.lineTo(670, y + 19);
    ctx.stroke();
    y += 56;
  }
  text(
    `เวลา ${costs.minutes / 60} ชม. · ${costs.courts} คอร์ท · ฿${baht(costs.courtRateCents)}/คอร์ท/ชม.`,
    50,
    y + 8,
    15,
    "#5c6c8d",
  );
  text(
    "ยอดต่อคน = ค่าใช้จ่ายรวม × เกมที่เล่น ÷ ผลรวมเกมของทุกคน",
    50,
    y + 36,
    15,
    "#5c6c8d",
  );
  text("COURTMATE · ตีด้วยกัน มันส์กว่า", 50, y + 73, 15, "#305db0", true);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("สร้างภาพไม่สำเร็จ"))),
      "image/png",
    ),
  );
}
