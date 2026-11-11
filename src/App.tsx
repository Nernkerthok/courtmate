import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  Flag,
  Image as ImageIcon,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  autoPair,
  baht,
  calculateBill,
  completeMatch,
  levelNames,
  MAX_PLAYERS,
  type Bill,
  type CostInput,
  type Match,
  type Player,
} from "./domain";
import { createBillImage } from "./export";

type Step = "group" | "play" | "cost";
type Played = { id: number; round: number; match: Match };
type Summary = { bill: Bill; costs: CostInput; name: string };
const steps = [
  { id: "group", label: "จัดก๊วน", sub: "เพิ่มเพื่อนร่วมสนาม", icon: Users },
  { id: "play", label: "จับคู่เล่น", sub: "แบ่งทีมและนับเกม", icon: Shuffle },
  { id: "cost", label: "ค่าใช้จ่าย", sub: "หารตามจำนวนที่เล่น", icon: Wallet },
] as const;
const colors = [
  "bg-[#dfebcf] text-[#607b44]",
  "bg-[#e1e9f2] text-[#647e9b]",
  "bg-[#f3e5d3] text-[#aa8457]",
  "bg-[#eae1ef] text-[#947da3]",
  "bg-[#f0dfe6] text-[#ab7c8f]",
];
const sampleNames = ["ต้น", "มิน", "เจมส์", "พลอย", "บาส", "ฟ้า", "นัท", "แพร"];
function Shuttle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="m26 68-9-48 17-9 16-5 17 5 17 9-11 48Z" fill="currentColor" />
      <path d="m27 67 46 0-9 24c-7 17-24 17-31 0Z" fill="#d6f68b" />
      <path
        d="m34 12 7 54m9-59v59m18-54-9 54M23 40h55M27 61h47"
        stroke="#36714f"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function Avatar({
  p,
  small = false,
}: {
  p: Pick<Player, "id" | "name">;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${small ? "size-8 text-xs" : "size-10 text-sm"} ${colors[(p.id - 1) % colors.length]}`}
    >
      {Array.from(p.name)[0] || "?"}
    </span>
  );
}
function Label({ title, children }: { title: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="caption">{title}</span>
      {children}
    </label>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>("group");
  const [groupName, setGroupName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(3);
  const id = useRef(1);
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [courts, setCourts] = useState(1);
  const [slots, setSlots] = useState<number[]>(Array(4).fill(0));
  const [matches, setMatches] = useState<Match[]>([]);
  const [round, setRound] = useState(0);
  const [history, setHistory] = useState<Played[]>([]);
  const gameId = useRef(1);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [costFields, setCostFields] = useState({
    hours: "2",
    courts: "1",
    rate: "200",
    shuttle: "0",
  });
  const [extras, setExtras] = useState<
    { id: number; name: string; amount: string }[]
  >([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const imageBlob = useRef<Blob | null>(null);
  const [modal, setModal] = useState<"image" | "reset" | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const notify = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4200);
  };
  const active = matches.some((m) => !m.done);
  const available = players.filter((p) => p.available).length;
  const totalPlayerGames = players.reduce((s, p) => s + p.games, 0);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    setSummary(null);
  }, [players, costFields, extras, groupName]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );
  const go = (next: Step) => {
    if (next !== "group" && players.length < 4) {
      notify("เพิ่มผู้เล่นอย่างน้อย 4 คนก่อนนะ");
      return;
    }
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addPlayer = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.length >= MAX_PLAYERS) {
      notify("เพิ่มได้สูงสุด 40 คน");
      return;
    }
    if (
      players.some(
        (p) => p.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
      )
    ) {
      notify("มีชื่อนี้แล้ว ลองเติมชื่อเล่นหรือหมายเลข");
      return;
    }
    setPlayers((p) => [
      ...p,
      { id: id.current++, name: trimmed, level, games: 0, available: true },
    ]);
    setName("");
  };
  const sample = () => {
    if (players.length) return;
    setGroupName("ก๊วนหลังเลิกงาน");
    setPlayers(
      sampleNames.map((n, i) => ({
        id: id.current++,
        name: n,
        level: [3, 2, 4, 3, 5, 1, 3, 2][i],
        games: 0,
        available: true,
      })),
    );
  };
  const prepare = () => {
    if (active) {
      notify("จบเกมในคอร์ทที่กำลังเล่นก่อน");
      return;
    }
    try {
      let next: Match[];
      if (mode === "auto") next = autoPair(players, courts);
      else {
        if (
          slots.length !== courts * 4 ||
          slots.some((s) => !s) ||
          new Set(slots).size !== slots.length
        )
          throw new Error("เลือกผู้เล่นให้ครบและไม่ซ้ำกันทุกคอร์ท");
        if (slots.some((s) => !players.some((p) => p.id === s && p.available)))
          throw new Error("เลือกเฉพาะคนที่พร้อมเล่น");
        next = Array.from({ length: courts }, (_, i) => ({
          id: i + 1,
          a: [slots[i * 4], slots[i * 4 + 1]],
          b: [slots[i * 4 + 2], slots[i * 4 + 3]],
          done: false,
        }));
      }
      setMatches(next);
      setRound((r) => r + 1);
      notify(
        mode === "auto"
          ? "จัดคู่แล้ว คนเล่นน้อยได้ลงก่อน"
          : "จัดคู่ตามที่เลือกแล้ว",
      );
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const finish = (match: Match) => {
    if (match.done) return;
    setPlayers((p) => completeMatch(p, match));
    setMatches((ms) =>
      ms.map((m) => (m.id === match.id ? { ...m, done: true } : m)),
    );
    setHistory((h) => [
      ...h,
      { id: gameId.current++, round, match: { ...match, done: true } },
    ]);
    notify(`จบเกมคอร์ท ${match.id} · ผู้เล่นทั้ง 4 คนเพิ่มคนละ 1 เกม`);
  };
  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    const ids = [...last.match.a, ...last.match.b];
    setPlayers((ps) =>
      ps.map((p) =>
        ids.includes(p.id) ? { ...p, games: Math.max(0, p.games - 1) } : p,
      ),
    );
    setHistory((h) => h.slice(0, -1));
    if (last.round === round)
      setMatches((ms) =>
        ms.map((m) => (m.id === last.match.id ? { ...m, done: false } : m)),
      );
    notify("ย้อนเกมล่าสุดแล้ว");
  };
  const costInput = useMemo<CostInput>(
    () => ({
      minutes: Math.round(Number(costFields.hours) * 60),
      courts: Number(costFields.courts),
      courtRateCents: Math.round(Number(costFields.rate) * 100),
      shuttleCostCents: Math.round(Number(costFields.shuttle) * 100),
      extras: extras.map((e) => ({
        name: e.name.trim() || "ค่าใช้จ่ายอื่น ๆ",
        cents: Math.round(Number(e.amount) * 100),
      })),
    }),
    [costFields, extras],
  );
  const calculate = async (e: FormEvent) => {
    e.preventDefault();
    if (active) {
      notify("จบเกมที่กำลังเล่นก่อนสรุปค่าใช้จ่าย");
      return;
    }
    if (!totalPlayerGames) {
      notify("ยังไม่มีเกมที่เล่นจบ กลับไปจับคู่แล้วกดจบเกมก่อน");
      return;
    }
    setCalculating(true);
    try {
      let bill = calculateBill(players, costInput);
      if (import.meta.env.VITE_USE_API === "true") {
        const response = await fetch("/api/settlements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            players: players.map(({ id, name, games }) => ({
              id,
              name,
              games,
            })),
            costs: costInput,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok)
          throw new Error("คำนวณจากเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองอีกครั้ง");
        const result = await response.json();
        if (
          result.totalCents !== bill.totalCents ||
          JSON.stringify(result.rows) !== JSON.stringify(bill.rows)
        )
          throw new Error("ผลคำนวณไม่ตรงกัน กรุณาตรวจข้อมูล");
        bill = result;
      }
      setSummary({
        bill,
        costs: costInput,
        name: groupName.trim() || "ก๊วนของเรา",
      });
      notify("คำนวณแล้ว ยอดทุกคนรวมตรงกับค่าใช้จ่าย");
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setCalculating(false);
    }
  };
  const openImage = async () => {
    if (!summary) return;
    setImageBusy(true);
    try {
      const blob = await createBillImage(
        summary.name,
        summary.bill,
        summary.costs,
      );
      imageBlob.current = blob;
      setImageUrl(URL.createObjectURL(blob));
      setModal("image");
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setImageBusy(false);
    }
  };
  const download = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "courtmate-summary.png";
    a.click();
    notify("ดาวน์โหลดรูปสรุปแล้ว");
  };
  const share = async () => {
    if (!imageBlob.current) return;
    const file = new File([imageBlob.current], "courtmate-summary.png", {
      type: "image/png",
    });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "สรุปค่าใช้จ่าย CourtMate",
        });
      } else {
        download();
        notify("อุปกรณ์นี้แชร์รูปตรงไม่ได้ ดาวน์โหลดแล้วแนบส่งในแชทได้เลย");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        notify("แชร์ไม่สำเร็จ ลองดาวน์โหลดภาพแล้วส่งในแชท");
    }
  };
  const reset = () => {
    setPlayers([]);
    setGroupName("");
    setName("");
    setMatches([]);
    setHistory([]);
    setRound(0);
    setCourts(1);
    setSlots(Array(4).fill(0));
    setSummary(null);
    setExtras([]);
    setCostFields({ hours: "2", courts: "1", rate: "200", shuttle: "0" });
    setModal(null);
    setStep("group");
    setImageUrl("");
    imageBlob.current = null;
    notify("พร้อมเริ่มก๊วนใหม่");
  };
  const nameFor = (pid: number) =>
    players.find((p) => p.id === pid)?.name || "—";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-[#e3e9dd] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => go("group")}
            className="flex items-center gap-1.5 text-[22px] font-semibold tracking-[-1px]"
            aria-label="CourtMate หน้าจัดก๊วน"
          >
            <Shuttle className="h-9 w-8 rotate-[28deg] text-club-700" />
            CourtMate
            <span className="ml-2 hidden border-l border-[#dce4d5] pl-3 text-[10px] font-normal tracking-normal text-[#8b9a7c] sm:inline">
              ตีด้วยกัน มันส์กว่า
            </span>
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-[#e0e8d8] bg-club-50 px-2 py-1 text-[9px] text-[#809568]">
              ทดลองใช้ v0.2
            </span>
            <button
              className="icon-btn"
              aria-label="เริ่มก๊วนใหม่"
              onClick={() => setModal("reset")}
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 pt-6 pb-28 sm:px-8 sm:pt-9">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">LESS ORGANIZING. MORE PLAYING.</p>
            <h1 className="mt-2 text-[27px] leading-normal font-semibold tracking-tight sm:text-3xl">
              {step === "group"
                ? "ก๊วนพร้อม ก็ไปกันเลย"
                : step === "play"
                  ? "คู่พร้อม คอร์ทพร้อม!"
                  : "จบเกม เคลียร์ง่าย"}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#8b9980]">
              {step === "group"
                ? "เริ่มจากรวมเพื่อน เลือกระดับ แล้วไปสนุกด้วยกัน"
                : step === "play"
                  ? "เลือกคู่ในแบบของก๊วน แล้วปล่อยให้เราช่วยนับเกม"
                  : "เล่นมากจ่ายมาก เล่นน้อยจ่ายน้อย ตรวจยอดก่อนแชร์ได้เลย"}
            </p>
          </div>
          <span className="mt-2 hidden items-center gap-2 rounded-full border border-[#dee7d4] px-3 py-2 text-[10px] text-[#8a9c76] sm:flex">
            <ShieldCheck size={14} />
            ไม่เก็บข้อมูลผู้เล่น
          </span>
        </div>
        <nav
          aria-label="ขั้นตอนใช้งาน"
          className="mb-6 grid grid-cols-3 overflow-hidden rounded-xl border border-[#dfe8d7] bg-white p-1.5 sm:mb-8"
        >
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              aria-current={step === s.id ? "step" : undefined}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-lg px-1 py-2 text-xs transition-colors sm:justify-start sm:gap-3 sm:px-5 ${step === s.id ? "bg-club-800 text-white" : "text-[#97a38c] hover:bg-club-50"}`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] ${step === s.id ? "bg-white/10 text-lime-pop" : "bg-[#f3f6ef]"}`}
              >
                {i + 1}
              </span>
              <span className="text-left">
                <span className="font-medium">{s.label}</span>
                <span
                  className={`mt-0.5 hidden text-[9px] sm:block ${step === s.id ? "text-[#a8c19b]" : "text-[#a5af9a]"}`}
                >
                  {s.sub}
                </span>
              </span>
              <s.icon className="ml-auto hidden lg:block" size={18} />
            </button>
          ))}
        </nav>

        {step === "group" && (
          <>
            <section className="relative mb-6 overflow-hidden rounded-2xl bg-club-900 p-6 text-white sm:p-8">
              <div className="relative z-10 max-w-[75%]">
                <span className="text-[8px] tracking-[.2em] text-[#c4daaf]">
                  A GOOD GAME STARTS WITH GOOD PEOPLE
                </span>
                <h2 className="mt-3 text-[29px] leading-[1.4] font-semibold tracking-tight sm:text-4xl">
                  เพื่อนครบ<span className="text-lime-pop">เมื่อไหร่</span>
                  <br />
                  ความสนุกก็เริ่ม.
                </h2>
                <p className="mt-3 text-[11px] leading-6 text-[#a6bfa3]">
                  ตั้งก๊วนวันนี้ จัดคู่ให้ลงตัว
                  <br className="sm:hidden" /> แล้วออกไปเก็บแรลลี่ดี ๆ ด้วยกัน
                </p>
              </div>
              <div className="pointer-events-none absolute -right-16 bottom-[-40px] h-48 w-64 rotate-[-30deg] border-[7px] border-[#467557] bg-[#2e6345]/70 sm:right-14 sm:h-56 sm:w-80">
                <div className="absolute inset-3 border border-[#b3d095]/55">
                  <div className="absolute inset-x-0 top-1/2 border-t border-[#b3d095]/55" />
                  <div className="absolute inset-y-0 left-1/2 border-l border-[#b3d095]/55" />
                  <div className="absolute inset-x-[15%] inset-y-0 border-x border-[#b3d095]/55" />
                </div>
              </div>
              <Shuttle className="absolute top-9 right-6 h-20 w-16 rotate-[25deg] text-[#edf5e4] sm:top-7 sm:right-20 sm:h-28 sm:w-24" />
              <Sparkles
                className="absolute top-14 right-24 text-lime-pop/60 sm:right-56"
                size={17}
              />
            </section>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
              <section className="card p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-medium">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-club-50 text-club-600">
                      <Users size={17} />
                    </span>
                    สร้างก๊วนของคุณ
                  </h2>
                  <span className="text-[10px] text-[#9aa58e]">STEP 01</span>
                </div>
                <Label title="ชื่อก๊วน (ไม่บังคับ)">
                  <input
                    className="field"
                    placeholder="เช่น ก๊วนหลังเลิกงาน"
                    maxLength={50}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </Label>
                <div className="my-6 border-t border-dashed border-[#e0e7d8]" />
                <form onSubmit={addPlayer}>
                  <Label title="ชื่อเล่นของเพื่อน">
                    <input
                      className="field"
                      placeholder="ชื่อที่เรียกกันในก๊วน"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={40}
                      disabled={active || players.length >= MAX_PLAYERS}
                    />
                  </Label>
                  <div className="mt-4">
                    <Label title="ระดับฝีมือ / Level">
                      <select
                        className="field"
                        aria-label="ระดับฝีมือของผู้เล่นใหม่"
                        value={level}
                        onChange={(e) => setLevel(Number(e.target.value))}
                      >
                        {levelNames.slice(1).map((l, i) => (
                          <option key={l} value={i + 1}>
                            Level {i + 1} · {l}
                          </option>
                        ))}
                      </select>
                    </Label>
                  </div>
                  <button
                    className="btn btn-primary mt-5 w-full"
                    disabled={active || players.length >= MAX_PLAYERS}
                  >
                    <Plus size={17} />
                    เพิ่มผู้เล่นเข้าก๊วน
                  </button>
                </form>
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f5f8f0] p-3 text-[10px] leading-5 text-[#91a17d]">
                  <CircleHelp size={15} className="mt-0.5 shrink-0" />
                  <p>
                    Level ใช้ช่วยบาลานซ์คู่ภายในคอร์ท
                    <br />
                    คนที่ลงเล่นน้อยจะได้สิทธิ์จับคู่ก่อนในโหมด Auto
                  </p>
                </div>
              </section>
              <section className="card p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-medium">
                      เพื่อนร่วมก๊วน
                      <span className="ml-2 rounded-md bg-club-50 px-2 py-0.5 text-xs text-club-600">
                        {players.length}
                      </span>
                    </h2>
                    <p className="mt-1 text-[10px] text-[#9aa58d]">
                      อย่างน้อย 4 คน · สูงสุด 40 คน
                    </p>
                  </div>
                  {players.length === 0 && (
                    <button
                      onClick={sample}
                      className="flex items-center gap-1 text-[10px] text-club-600"
                    >
                      <Sparkles size={13} />
                      ลองรายชื่อตัวอย่าง
                    </button>
                  )}
                </div>
                {players.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe8d4] bg-[#fafcf7] text-center">
                    <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#edf3e2] text-[#9ab77c]">
                      <Users size={28} />
                    </span>
                    <h3 className="text-sm font-medium text-[#6f8855]">
                      ที่ว่างสำหรับเพื่อนของคุณ
                    </h3>
                    <p className="mt-2 text-[11px] leading-6 text-[#9aa68d]">
                      เพิ่มชื่อและ Level ทีละคน
                      <br />
                      ครบก๊วนแล้วไปจับคู่กัน
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl border border-[#edf0e7] bg-[#fcfdf9] p-3"
                      >
                        <Avatar p={p} />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {p.name}
                          </span>
                          <label className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8e9e7a]">
                            Level
                            <select
                              aria-label={`Level ${p.name}`}
                              value={p.level}
                              disabled={active}
                              onChange={(e) =>
                                setPlayers((ps) =>
                                  ps.map((x) =>
                                    x.id === p.id
                                      ? { ...x, level: Number(e.target.value) }
                                      : x,
                                  ),
                                )
                              }
                              className="min-h-8 rounded bg-transparent pr-1 text-xs text-club-600"
                            >
                              {levelNames.slice(1).map((l, i) => (
                                <option key={l} value={i + 1}>
                                  {i + 1} · {l}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <span className="shrink-0 text-[10px] text-[#96a48b]">
                          {p.games} เกม
                        </span>
                        <button
                          className="icon-btn -mr-2"
                          disabled={active || p.games > 0}
                          title={
                            p.games
                              ? "ผู้เล่นที่มีเกมแล้วจะเก็บไว้เพื่อหารค่าใช้จ่าย"
                              : "ลบผู้เล่น"
                          }
                          aria-label={`ลบ ${p.name}`}
                          onClick={() =>
                            setPlayers((ps) => ps.filter((x) => x.id !== p.id))
                          }
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-primary mt-6 w-full"
                  disabled={players.length < 4}
                  onClick={() => go("play")}
                >
                  ไปจับคู่เล่น
                  <ArrowRight size={17} />
                </button>
                {players.length > 0 && players.length < 4 && (
                  <p className="mt-3 text-center text-[10px] text-[#9aa789]">
                    อีก {4 - players.length} คน ก็เริ่มเกมได้แล้ว
                  </p>
                )}
              </section>
            </div>
          </>
        )}

        {step === "play" && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="eyebrow">{groupName || "ก๊วนของเรา"}</span>
                <p className="mt-1 text-xs text-[#8a9a7c]">
                  {players.length} ผู้เล่น · จบแล้ว {history.length} เกม
                </p>
              </div>
              <button
                className="btn btn-secondary text-xs"
                onClick={() => go("cost")}
              >
                สรุปค่าใช้จ่าย
                <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <div className="space-y-5">
                <section className="card p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-medium">
                      จับคู่ในแบบของก๊วน
                    </h2>
                    <Shuffle size={19} className="text-[#9bb485]" />
                  </div>
                  <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[#eff3e8] p-1">
                    <button
                      className={`min-h-11 rounded-lg text-sm ${mode === "auto" ? "bg-white text-club-700 shadow-sm" : "text-[#95a187]"}`}
                      disabled={active}
                      onClick={() => setMode("auto")}
                    >
                      Auto{" "}
                      <span className="text-[10px]">· จัดให้อัตโนมัติ</span>
                    </button>
                    <button
                      className={`min-h-11 rounded-lg text-sm ${mode === "custom" ? "bg-white text-club-700 shadow-sm" : "text-[#95a187]"}`}
                      disabled={active}
                      onClick={() => setMode("custom")}
                    >
                      Custom <span className="text-[10px]">· เลือกเอง</span>
                    </button>
                  </div>
                  <Label title="จำนวนคอร์ทที่เล่นพร้อมกัน">
                    <select
                      className="field"
                      aria-label="จำนวนคอร์ทจับคู่"
                      disabled={active}
                      value={courts}
                      onChange={(e) => {
                        setCourts(Number(e.target.value));
                        setSlots(Array(Number(e.target.value) * 4).fill(0));
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} คอร์ท · {n * 4} คน
                        </option>
                      ))}
                    </select>
                  </Label>
                  {mode === "auto" ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-club-50 p-3 text-[11px] leading-6 text-[#81986b]">
                      <Sparkles size={16} className="mt-1 shrink-0" />
                      <p>
                        ให้คนที่เล่นน้อยได้ลงก่อน สุ่มเมื่อจำนวนเกมเท่ากัน
                        แล้วจับคู่ให้ Level รวมของสองทีมใกล้กันในแต่ละคอร์ท
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-5">
                      {Array.from({ length: courts }, (_, c) => (
                        <div
                          key={c}
                          className="rounded-xl border border-[#e4ebdb] p-3"
                        >
                          <h3 className="mb-3 text-xs font-medium text-[#81986b]">
                            คอร์ท {c + 1} · เลือกทีม A และทีม B
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {Array.from({ length: 4 }, (_, s) => {
                              const index = c * 4 + s;
                              return (
                                <Label
                                  key={s}
                                  title={`ทีม ${s < 2 ? "A" : "B"} · คนที่ ${(s % 2) + 1}`}
                                >
                                  <select
                                    aria-label={`คอร์ท ${c + 1} ทีม ${s < 2 ? "A" : "B"} คนที่ ${(s % 2) + 1}`}
                                    className="field !text-sm"
                                    value={slots[index] || 0}
                                    disabled={active}
                                    onChange={(e) =>
                                      setSlots((values) =>
                                        values.map((v, i) =>
                                          i === index
                                            ? Number(e.target.value)
                                            : v,
                                        ),
                                      )
                                    }
                                  >
                                    <option value={0}>เลือกผู้เล่น</option>
                                    {players
                                      .filter(
                                        (p) =>
                                          p.available &&
                                          (!slots.includes(p.id) ||
                                            slots[index] === p.id),
                                      )
                                      .map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name} · L{p.level} · {p.games} เกม
                                        </option>
                                      ))}
                                  </select>
                                </Label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="btn btn-primary mt-5 w-full"
                    disabled={active || available < courts * 4}
                    onClick={prepare}
                  >
                    <Shuffle size={17} />
                    {active
                      ? "มีเกมที่กำลังเล่นอยู่"
                      : round
                        ? "จัดคู่รอบถัดไป"
                        : "จัดคู่พร้อมลงสนาม"}
                  </button>
                  {available < courts * 4 && (
                    <p className="mt-3 text-center text-[10px] text-[#b28a5c]">
                      พร้อมเล่น {available} คน ต้องมีอย่างน้อย {courts * 4} คน
                    </p>
                  )}
                </section>
                {matches.length > 0 ? (
                  <section className="space-y-4">
                    <div className="flex justify-between">
                      <h2 className="text-sm font-medium">คู่ประจำรอบนี้</h2>
                      <span className="text-[10px] text-[#8d9e79]">
                        ROUND {String(round).padStart(2, "0")}
                      </span>
                    </div>
                    {matches.map((m) => (
                      <article
                        className={`overflow-hidden rounded-2xl border-[5px] ${m.done ? "border-[#e0e8d6] bg-[#f1f5e9]" : "border-[#38674a] bg-club-800 text-white"}`}
                        key={m.id}
                      >
                        <div
                          className={`flex items-center justify-between px-4 py-3 text-[10px] tracking-widest ${m.done ? "bg-[#e7eedc] text-[#8b9e75]" : "bg-club-900 text-[#c6dda9]"}`}
                        >
                          <span>COURT {String(m.id).padStart(2, "0")}</span>
                          <span className="flex items-center gap-1 text-[9px] tracking-normal">
                            {m.done ? (
                              <>
                                <Check size={13} />
                                จบเกมแล้ว
                              </>
                            ) : (
                              "ประเภทคู่ · 4 คน"
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-[1fr_30px_1fr] items-center px-3 py-6">
                          {[m.a, m.b].map((team, t) => (
                            <div
                              key={t}
                              className={`flex min-w-0 flex-col items-center gap-3 ${t === 1 ? "col-start-3" : ""}`}
                            >
                              {team.map((pid) => {
                                const p = players.find((p) => p.id === pid)!;
                                return (
                                  <div
                                    key={pid}
                                    className="flex max-w-full items-center gap-2"
                                  >
                                    <Avatar p={p} small />
                                    <span className="min-w-0 text-sm">
                                      <span className="block max-w-24 truncate">
                                        {p.name}
                                      </span>
                                      <span
                                        className={`text-[8px] ${m.done ? "text-[#94a284]" : "text-[#a8c393]"}`}
                                      >
                                        LEVEL {p.level}
                                      </span>
                                    </span>
                                  </div>
                                );
                              })}
                              <span
                                className={`mt-1 text-[9px] ${m.done ? "text-[#8b9e75]" : "text-[#9fbb8c]"}`}
                              >
                                ทีม {t === 0 ? "A" : "B"} · L
                                {team.reduce(
                                  (s, pid) =>
                                    s +
                                    (players.find((p) => p.id === pid)?.level ||
                                      0),
                                  0,
                                )}
                              </span>
                            </div>
                          ))}
                          <span className="col-start-2 row-start-1 text-center text-[10px] opacity-60">
                            VS
                          </span>
                        </div>
                        <div className="px-4 pb-4">
                          <button
                            className={`btn w-full ${m.done ? "bg-[#e2ecd4] text-[#7b945d]" : "bg-lime-pop text-club-900"}`}
                            disabled={m.done}
                            onClick={() => finish(m)}
                          >
                            {m.done ? <Check size={17} /> : <Flag size={17} />}{" "}
                            {m.done
                              ? "นับเกมเรียบร้อย"
                              : "จบเกมนี้ · เพิ่มคนละ 1 เกม"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </section>
                ) : (
                  <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#dbe5cf] text-center">
                    <Shuttle className="mb-4 h-14 w-12 rotate-[25deg] text-[#96b575]" />
                    <h3 className="text-sm text-[#718c56]">
                      แรลลี่แรกกำลังรออยู่
                    </h3>
                    <p className="mt-2 text-[11px] text-[#a0ac91]">
                      จัดคู่แล้ว รายชื่อทีมจะแสดงตรงนี้
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-5">
                <section className="card p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-medium">
                      ใครเล่นไปกี่เกมแล้ว
                    </h2>
                    <span className="rounded-md bg-club-50 px-2 py-1 text-[10px] text-[#87a06a]">
                      {available} คนพร้อม
                    </span>
                  </div>
                  <p className="mt-2 mb-5 text-[10px] leading-5 text-[#9aa68c]">
                    นับเมื่อกด “จบเกมนี้” เท่านั้น · ปิดพร้อมเล่นเมื่อพัก
                  </p>
                  <div className="space-y-1">
                    {[...players]
                      .sort((a, b) => a.games - b.games || a.id - b.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 border-b border-[#eef1e8] py-3 last:border-0"
                        >
                          <Avatar p={p} />
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-sm font-medium">
                              {p.name}
                            </strong>
                            <span className="text-[9px] text-[#9aa789]">
                              LEVEL {p.level} · {levelNames[p.level]}
                            </span>
                          </span>
                          <span className="text-center">
                            <strong className="block text-xl font-semibold leading-none">
                              {p.games}
                            </strong>
                            <span className="text-[8px] text-[#9aa789]">
                              เกม
                            </span>
                          </span>
                          <button
                            role="switch"
                            aria-label={`พร้อมเล่น ${p.name}`}
                            aria-checked={p.available}
                            disabled={active}
                            onClick={() =>
                              setPlayers((ps) =>
                                ps.map((x) =>
                                  x.id === p.id
                                    ? { ...x, available: !x.available }
                                    : x,
                                ),
                              )
                            }
                            className={`ml-1 h-6 w-10 shrink-0 rounded-full p-1 transition-colors ${p.available ? "bg-[#82a35e]" : "bg-[#e1e6da]"}`}
                          >
                            <span
                              className={`block size-4 rounded-full bg-white transition-transform ${p.available ? "translate-x-4" : ""}`}
                            />
                          </button>
                        </div>
                      ))}
                  </div>
                </section>
                {history.length > 0 && (
                  <section className="card p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium">เกมที่เล่นจบแล้ว</h2>
                      <button
                        className="flex items-center gap-1 text-[10px] text-[#8ba06f]"
                        onClick={undo}
                      >
                        <RotateCcw size={12} />
                        ย้อนเกมล่าสุด
                      </button>
                    </div>
                    <div className="mt-4 max-h-72 overflow-y-auto">
                      {[...history].reverse().map((h) => (
                        <div
                          className="border-b border-[#eef1e8] py-3 last:border-0"
                          key={h.id}
                        >
                          <span className="text-[9px] text-[#9ba78d]">
                            รอบ {h.round} / คอร์ท {h.match.id}
                          </span>
                          <p className="mt-1 text-[11px] leading-6">
                            {h.match.a.map(nameFor).join(" + ")}{" "}
                            <span className="mx-1 text-[9px] text-[#a3af96]">
                              VS
                            </span>{" "}
                            {h.match.b.map(nameFor).join(" + ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}

        {step === "cost" && (
          <>
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#dfe8d4] bg-[#edf3e3] p-4">
              <ShieldCheck
                className="mt-0.5 shrink-0 text-[#8ba46b]"
                size={18}
              />
              <p className="text-[11px] leading-6 text-[#83966f]">
                ยอดต่อคน = ค่าใช้จ่ายทั้งหมด × จำนวนเกมของคนนั้น ÷
                ผลรวมเกมของทุกคน คนที่ยังไม่ได้เล่นไม่ถูกคิดเงิน
                ปัดเศษเป็นสตางค์ให้ยอดรวมตรงกัน
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
              <form onSubmit={calculate} className="card p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-base font-medium">ใส่ค่าใช้จ่ายรอบนี้</h2>
                  <Wallet size={19} className="text-[#9bb485]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Label title="จำนวนชั่วโมง">
                    <input
                      className="field"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="24"
                      step="0.25"
                      required
                      value={costFields.hours}
                      onChange={(e) =>
                        setCostFields((c) => ({ ...c, hours: e.target.value }))
                      }
                    />
                  </Label>
                  <Label title="จำนวนคอร์ทที่เช่า">
                    <input
                      className="field"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="20"
                      step="1"
                      required
                      value={costFields.courts}
                      onChange={(e) =>
                        setCostFields((c) => ({ ...c, courts: e.target.value }))
                      }
                    />
                  </Label>
                </div>
                <div className="mt-5">
                  <Label title="ค่าสนาม / คอร์ท / ชั่วโมง (บาท)">
                    <input
                      className="field"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="1000000"
                      step="0.01"
                      required
                      value={costFields.rate}
                      onChange={(e) =>
                        setCostFields((c) => ({ ...c, rate: e.target.value }))
                      }
                    />
                  </Label>
                  <p className="mt-2 text-[10px] text-[#9ba78e]">
                    ค่าสนามรวม = ชั่วโมง × จำนวนคอร์ท × ราคาต่อชั่วโมง
                  </p>
                </div>
                <div className="mt-5">
                  <Label title="ค่าลูกแบดรวม (บาท)">
                    <input
                      className="field"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="1000000"
                      step="0.01"
                      required
                      value={costFields.shuttle}
                      onChange={(e) =>
                        setCostFields((c) => ({
                          ...c,
                          shuttle: e.target.value,
                        }))
                      }
                    />
                  </Label>
                </div>
                <div className="mt-6 border-t border-dashed border-[#e2e8d8] pt-5">
                  <div className="mb-4 flex justify-between">
                    <h3 className="text-xs font-medium text-[#889b75]">
                      ค่าใช้จ่ายอื่น ๆ
                    </h3>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-club-600"
                      disabled={extras.length >= 20}
                      onClick={() =>
                        setExtras((es) => [
                          ...es,
                          { id: Date.now() + es.length, name: "", amount: "" },
                        ])
                      }
                    >
                      <Plus size={14} />
                      เพิ่มรายการ
                    </button>
                  </div>
                  {extras.length === 0 && (
                    <p className="text-[10px] text-[#a3ad97]">
                      ค่าน้ำ ขนม หรือรายการที่ก๊วนหารด้วยกัน
                    </p>
                  )}
                  <div className="space-y-3">
                    {extras.map((e, i) => (
                      <div className="flex items-center gap-2" key={e.id}>
                        <input
                          className="field !text-sm"
                          aria-label={`ชื่อค่าใช้จ่ายเพิ่มเติม ${i + 1}`}
                          placeholder="ชื่อรายการ"
                          maxLength={60}
                          required
                          value={e.name}
                          onChange={(ev) =>
                            setExtras((es) =>
                              es.map((x) =>
                                x.id === e.id
                                  ? { ...x, name: ev.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                        <input
                          className="field !w-28 !text-sm"
                          aria-label={`ยอดค่าใช้จ่ายเพิ่มเติม ${i + 1}`}
                          placeholder="บาท"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="1000000"
                          step="0.01"
                          required
                          value={e.amount}
                          onChange={(ev) =>
                            setExtras((es) =>
                              es.map((x) =>
                                x.id === e.id
                                  ? { ...x, amount: ev.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          className="icon-btn !size-8"
                          aria-label={`ลบค่าใช้จ่ายเพิ่มเติม ${i + 1}`}
                          onClick={() =>
                            setExtras((es) => es.filter((x) => x.id !== e.id))
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="btn btn-primary mt-7 w-full"
                  disabled={active || !totalPlayerGames || calculating}
                >
                  <Wallet size={17} />
                  {calculating ? "กำลังคำนวณ..." : "คำนวณค่าใช้จ่าย"}
                </button>
                {(active || !totalPlayerGames) && (
                  <p className="mt-3 text-center text-[10px] leading-6 text-[#b08f5f]">
                    {active
                      ? "ยังมีคอร์ทที่กำลังเล่น จบเกมก่อนสรุปนะ"
                      : "ยังไม่มีเกมที่เล่นจบ ไปจับคู่แล้วเริ่มเกมก่อน"}
                  </p>
                )}
              </form>
              <div>
                {summary ? (
                  <section className="overflow-hidden rounded-2xl border border-[#dce7d2]">
                    <div className="relative overflow-hidden bg-club-900 p-6 text-white">
                      <p className="text-[9px] tracking-[.15em] text-[#c2d8a9]">
                        {summary.name} / SESSION SUMMARY
                      </p>
                      <p className="mt-5 text-xs text-[#a4bc98]">
                        ค่าใช้จ่ายทั้งหมด
                      </p>
                      <p className="mt-1 text-4xl font-semibold tracking-tight">
                        ฿{baht(summary.bill.totalCents)}
                      </p>
                      <p className="mt-3 text-[10px] text-[#a4bc98]">
                        จบแล้ว {history.length} เกม · ผู้เล่น {players.length}{" "}
                        คน
                      </p>
                      <Shuttle className="absolute right-5 bottom-6 h-24 w-20 rotate-[25deg] text-white/15" />
                    </div>
                    <div className="bg-white p-5 sm:p-6">
                      <div className="mb-5 space-y-3 border-b border-[#e6eddd] pb-5 text-xs text-[#8c9e78]">
                        <div className="flex justify-between">
                          <span>ค่าสนาม</span>
                          <span>฿{baht(summary.bill.courtCents)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าลูกแบด</span>
                          <span>฿{baht(summary.costs.shuttleCostCents)}</span>
                        </div>
                        {summary.costs.extras.map((e, i) => (
                          <div className="flex justify-between gap-4" key={i}>
                            <span className="min-w-0 break-words">
                              {e.name}
                            </span>
                            <span className="shrink-0">฿{baht(e.cents)}</span>
                          </div>
                        ))}
                      </div>
                      <table className="w-full table-fixed text-left">
                        <caption className="mb-4 text-left text-sm font-medium">
                          ตารางหารค่าใช้จ่าย
                        </caption>
                        <thead>
                          <tr className="border-b border-[#e6eddd] text-[10px] text-[#98a888]">
                            <th className="w-[45%] pb-3 font-normal">
                              ผู้เล่น
                            </th>
                            <th className="w-[15%] pb-3 text-center font-normal">
                              เกม
                            </th>
                            <th className="pb-3 text-right font-normal">
                              ยอดชำระ (บาท)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.bill.rows.map((p) => (
                            <tr
                              className="border-b border-[#eef2e8]"
                              key={p.id}
                            >
                              <td className="py-3 text-sm break-words">
                                {p.name}
                              </td>
                              <td className="text-center text-xs text-[#8e9e79]">
                                {p.games}
                              </td>
                              <td className="text-right text-sm font-medium">
                                {baht(p.cents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th
                              colSpan={2}
                              className="pt-4 text-xs font-medium"
                            >
                              รวมทั้งหมด
                            </th>
                            <td className="pt-4 text-right text-sm font-semibold">
                              {baht(summary.bill.totalCents)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <button
                        className="btn btn-primary mt-6 w-full"
                        onClick={openImage}
                        disabled={imageBusy}
                      >
                        <ImageIcon size={17} />
                        {imageBusy
                          ? "กำลังสร้างรูป..."
                          : "สร้างรูปสรุป · ดาวน์โหลด / แชร์"}
                      </button>
                      <p className="mt-3 text-center text-[9px] leading-5 text-[#9ba98b]">
                        ไฟล์ PNG พร้อมส่งเข้ากลุ่ม · ไม่มีการอัปโหลดรูป
                      </p>
                    </div>
                  </section>
                ) : (
                  <section className="card flex min-h-80 flex-col items-center justify-center p-7 text-center">
                    <span className="mb-5 flex size-20 items-center justify-center rounded-2xl bg-club-50 text-[#9ab77c]">
                      <Wallet size={34} />
                    </span>
                    <h2 className="text-base font-medium text-[#6b8752]">
                      ค่าใช้จ่ายชัด ก๊วนก็แฮปปี้
                    </h2>
                    <p className="mt-3 text-xs leading-7 text-[#9aaa8c]">
                      กรอกค่าใช้จ่าย แล้วกดคำนวณ
                      <br />
                      ตารางรายคนและรูปพร้อมแชร์จะอยู่ตรงนี้
                    </p>
                    <span className="mt-6 rounded-md border border-[#e3ead9] px-3 py-1.5 text-[8px] tracking-widest text-[#9aaa8c]">
                      FAIR SHARES. GOOD VIBES.
                    </span>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
        <div className="mt-7 flex items-start justify-center gap-2 rounded-xl border border-dashed border-[#dce6d0] p-4 text-[10px] leading-5 text-[#91a07d]">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
          <p>
            ใช้เฉพาะระหว่างเปิดหน้านี้ · รีเฟรชหรือปิดหน้า ข้อมูลจะหาย
            <br className="sm:hidden" /> ดาวน์โหลดรูปสรุปก่อนออกเมื่อเล่นเสร็จ
          </p>
        </div>
        <footer className="mt-7 flex items-center justify-between border-t border-[#e2e9db] pt-5 text-[9px] text-[#9baa8c]">
          <span className="font-medium">
            CourtMate <span className="ml-1 font-normal">/ v0.2</span>
          </span>
          <span className="text-[7px] tracking-[.13em]">
            SEE YOU ON COURT. <span className="ml-2 text-[#9fb77b]">✦</span>
          </span>
        </footer>
      </div>
      <nav
        aria-label="เมนูมือถือ"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[#e0e8d6] bg-white/95 px-6 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden"
      >
        {steps.map((s) => (
          <button
            key={s.id}
            aria-current={step === s.id ? "page" : undefined}
            onClick={() => go(s.id)}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[9px] ${step === s.id ? "font-medium text-club-700" : "text-[#9aa98a]"}`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-lg ${step === s.id ? "bg-club-50" : ""}`}
            >
              <s.icon size={19} />
            </span>
            {s.label}
          </button>
        ))}
      </nav>
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-40 flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 items-start gap-2 rounded-xl border border-[#507546] bg-club-900 px-4 py-3 text-xs leading-6 text-[#e1edcf] shadow-lg sm:bottom-7"
        >
          <Check size={15} className="mt-1 shrink-0 text-lime-pop" />
          {toast}
          <button
            aria-label="ปิดข้อความ"
            onClick={() => setToast("")}
            className="ml-2 mt-1"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-labelledby="dialog-title"
        className={`m-auto max-h-[90dvh] w-[calc(100%-32px)] max-w-lg rounded-2xl border border-[#dce6d2] bg-white p-0 text-club-900 shadow-xl ${modal === "image" ? "overflow-hidden" : "overflow-auto"}`}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="flex items-center justify-between border-b border-[#e8eedf] px-5 py-4">
          <h2 id="dialog-title" className="text-base font-medium">
            {modal === "image" ? "รูปสรุปค่าใช้จ่าย" : "เริ่มก๊วนใหม่?"}
          </h2>
          <button
            aria-label="ปิดหน้าต่าง"
            className="icon-btn"
            onClick={() => setModal(null)}
          >
            <X size={19} />
          </button>
        </div>
        {modal === "image" ? (
          <>
            <div className="max-h-[60dvh] overflow-y-auto bg-[#f1f5e9] p-4">
              <img
                src={imageUrl}
                alt="รูปตารางสรุปค่าใช้จ่ายตามจำนวนเกม"
                className="mx-auto h-auto w-full shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <button className="btn btn-secondary" onClick={download}>
                <Download size={17} />
                ดาวน์โหลด PNG
              </button>
              <button className="btn btn-primary" onClick={share}>
                <Share2 size={17} />
                แชร์รูป
              </button>
            </div>
          </>
        ) : (
          <div className="p-5">
            <p className="text-sm leading-7 text-[#879b72]">
              รายชื่อ จำนวนเกม และค่าใช้จ่ายในรอบนี้จะถูกล้าง
              หากต้องการเก็บสรุปให้ดาวน์โหลดรูปก่อนเริ่มใหม่
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
              >
                กลับไปก่อน
              </button>
              <button className="btn btn-primary" onClick={reset}>
                เริ่มก๊วนใหม่
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
