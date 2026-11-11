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
  ctx.fillStyle = "#f3f7f4";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#103e33";
  ctx.fillRect(0, 0, width, 200);
  const text = (
    s: string,
    x: number,
    y: number,
    size = 22,
    color = "#153e35",
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
    color = "#153e35",
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
  text("COURTMATE / สรุปค่าใช้จ่าย", 50, 54, 18, "#d4f578", true);
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
    "#acc5af",
  );
  let y = 250;
  text("รายการค่าใช้จ่าย", 50, y, 22, "#153e35", true);
  y += 43;
  for (const [label, amount] of lineItems) {
    text(fit(label, 420), 50, y, 20, "#526b65");
    right(`฿${baht(amount)}`, y, 20);
    y += 44;
  }
  ctx.strokeStyle = "#dfe6d6";
  ctx.beginPath();
  ctx.moveTo(50, y - 17);
  ctx.lineTo(670, y - 17);
  ctx.stroke();
  text("รวมทั้งหมด", 50, y + 15, 22, "#153e35", true);
  right(`฿${baht(bill.totalCents)}`, y + 15, 28, "#075e49", true);
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
      text(equationLine, 50, y, 18, "#526b65");
      y += 28;
      equationLine = word;
    } else equationLine = candidate;
  }
  if (equationLine) {
    text(equationLine, 50, y, 18, "#526b65");
    y += 32;
  }
  text(
    `${baht(bill.totalCents)} ÷ ${bill.totalGames} = ${baht(gameRate(bill))} บาท`,
    50,
    y,
    23,
    "#075e49",
    true,
  );
  y += 31;
  text("ราคาเฉลี่ยต่อคนต่อเกม (ก่อนปัดเศษรายคน)", 50, y, 17, "#526b65");
  y += 39;
  text(
    `หารตามจำนวนเกม · ผลรวมเกมของผู้เล่นทุกคน ${bill.totalGames}`,
    50,
    y,
    17,
    "#526b65",
  );
  y += 38;
  ctx.fillStyle = "#d9efe5";
  ctx.fillRect(40, y - 26, 640, 45);
  text("ผู้เล่น", 55, y + 5, 18, "#103e33", true);
  ctx.textAlign = "center";
  text("เกม", 455, y + 5, 18, "#103e33", true);
  ctx.textAlign = "left";
  right("ยอดชำระ (บาท)", y + 5, 18, "#103e33", true);
  y += 56;
  for (const row of bill.rows) {
    text(fit(row.name, 340), 55, y, 21);
    ctx.textAlign = "center";
    text(String(row.games), 455, y, 21);
    ctx.textAlign = "left";
    right(baht(row.cents), y, 22, "#153e35", true);
    ctx.strokeStyle = "#e6ebdf";
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
    "#526b65",
  );
  text(
    "ยอดต่อคน = ค่าใช้จ่ายรวม × เกมที่เล่น ÷ ผลรวมเกมของทุกคน",
    50,
    y + 36,
    15,
    "#526b65",
  );
  text("COURTMATE · ตีด้วยกัน มันส์กว่า", 50, y + 73, 15, "#2f6956", true);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("สร้างภาพไม่สำเร็จ"))),
      "image/png",
    ),
  );
}
