import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Flag,
  Image as ImageIcon,
  MoreHorizontal,
  Plus,
  Pencil,
  RotateCcw,
  Settings2,
  Share2,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  Smartphone,
  X,
} from "lucide-react";
import { type ReactNode } from "react";
import { baht, gameRate, levelNames, MAX_PLAYERS, type Player } from "./domain";
import { useCourtMate } from "./useCourtMate";
import { useInstall } from "./useInstall";

const steps = [
  { id: "group", label: "จัดก๊วน", icon: Users },
  { id: "play", label: "จับคู่เล่น", icon: Shuffle },
  { id: "cost", label: "ค่าใช้จ่าย", icon: Wallet },
] as const;
const colors = [
  "bg-[#e2efcf] text-[#426522]",
  "bg-[#e2edf5] text-[#395f82]",
  "bg-[#f6e8cf] text-[#805e28]",
  "bg-[#eee4f4] text-[#715187]",
  "bg-[#f5e2e9] text-[#8b4463]",
];
function Shuttle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="m26 68-9-48 17-9 16-5 17 5 17 9-11 48Z" fill="currentColor" />
      <path d="m27 67 46 0-9 24c-7 17-24 17-31 0Z" fill="#d8f7ff" />
      <path
        d="m34 12 7 54m9-59v59m18-54-9 54M23 40h55M27 61h47"
        stroke="#2997d0"
        strokeWidth="1.7"
      />
    </svg>
  );
}
function Avatar({ p }: { p: Pick<Player, "id" | "name"> }) {
  const shirts = ["#078bff", "#4ab694", "#9670ee", "#ed9b4d", "#e778a1"];
  const skin = p.id % 3 === 0 ? "#d59669" : "#ffc79b";
  return (
    <span
      aria-hidden="true"
      className={`player-avatar flex size-9 shrink-0 items-center justify-center rounded-full text-sm ${colors[(p.id - 1) % colors.length]}`}
    >
      <svg viewBox="0 0 48 48" fill="none">
        <path
          d="M7 48c0-12 7-17 17-17s17 5 17 17"
          fill={shirts[(p.id - 1) % shirts.length]}
        />
        <path d="m19 30 5 8 5-8" fill="white" />
        <rect x="20" y="26" width="8" height="10" rx="3" fill={skin} />
        {p.id % 2 === 0 && (
          <path d="M12 20C10 3 38 3 36 20l2 18-10-4-10 2-8-1Z" fill="#27314a" />
        )}
        <ellipse cx="24" cy="20" rx="11" ry="14" fill={skin} />
        <path
          d="M13 19C8 6 23 2 28 6c10-1 10 9 7 13l-4-8c-4 5-10 3-14 2l-3 8Z"
          fill="#27314a"
        />
        <path
          d="M19 20h.1m9.8 0h.1"
          stroke="#27314a"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <path
          d="M21 26q3 3 6 0"
          stroke="#a95c47"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
function CourtArt() {
  return (
    <svg
      className="court-art"
      viewBox="0 0 640 220"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="hall"
          x2="640"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#163e72" />
          <stop offset="1" stopColor="#71ddff" />
        </linearGradient>
        <linearGradient
          id="floor"
          x1="320"
          y1="110"
          x2="320"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#64e6ac" />
          <stop offset="1" stopColor="#20b68c" />
        </linearGradient>
      </defs>
      <path fill="url(#hall)" d="M0 0h640v220H0z" />
      <path fill="#95deff" d="m0 40 130 53v85L0 207z" />
      <path fill="#b2eaff" d="M130 93h380v85H130z" />
      <path fill="#80bce6" d="m510 93 130-53v167l-130-29z" />
      <path fill="#ffa8c0" d="M130 112h380v35H130z" />
      <path fill="#61c5ec" d="M130 147h380v31H130z" />
      <path fill="#235484" d="m0 0 130 93h380L640 0v25L520 106H120L0 25z" />
      <path
        d="m110 0 72 93M270 0l12 93M430 0l-48 93M590 0l-108 93"
        stroke="#3273a8"
        strokeWidth="15"
      />
      <path
        d="m111 28 42 8 12 16-42-8zm156-3 42 2 2 16-42-2zm151 2 42-2-8 16-42 2zm111 9 42-8-12 16-42 8z"
        fill="#e5faff"
      />
      <path fill="url(#floor)" d="M130 171h380l130 49H0z" />
      <path
        d="m170 179-74 34h448l-74-34H170Zm150 0v34m-182-20h364m-313-14-48 34m290-34 48 34"
        stroke="white"
        strokeWidth="2.5"
      />
      <path
        d="M170 94v81m340-81v81M69 68v126m504-126v126"
        stroke="#2778ac"
        strokeWidth="11"
      />
      <path fill="#d5edff" fillOpacity=".45" d="M129 146h382v35H129z" />
      <path
        d="M130 151h380m-380 8h380m-380 8h380m-380 8h380m-350-29v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35m30-35v35"
        stroke="#f0fbff"
        strokeWidth="1"
      />
      <path d="M129 144h382" stroke="white" strokeWidth="5" />
      <path
        d="M127 140v48m386-48v48"
        stroke="#174d89"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
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
function TeamPicker({
  values,
  players,
  optionsFor,
  labelFor,
  onChange,
}: {
  values: number[];
  players: Player[];
  optionsFor: (index: number) => Player[];
  labelFor: (index: number) => string;
  onChange: (index: number, id: number) => void;
}) {
  return (
    <div className="team-picker">
      {["A", "B"].map((team, t) => (
        <fieldset
          className={`team-choice team-choice-${team.toLowerCase()}`}
          key={team}
        >
          <legend>ทีม {team}</legend>
          <div className="team-choice-slots">
            {[0, 1].map((position) => {
              const index = t * 2 + position;
              const selected = players.find((p) => p.id === values[index]);
              return (
                <label className="player-slot" key={position}>
                  <span className="slot-caption">คนที่ {position + 1}</span>
                  <span className="slot-control">
                    <select
                      required
                      aria-label={labelFor(index)}
                      value={values[index] || ""}
                      onChange={(e) => onChange(index, Number(e.target.value))}
                    >
                      <option value="">เลือกผู้เล่น</option>
                      {optionsFor(index).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · L{p.level} · {p.games} เกม
                        </option>
                      ))}
                    </select>
                    <span className="slot-value" aria-hidden="true">
                      <strong title={selected?.name}>
                        {selected?.name || "เลือกผู้เล่น"}
                      </strong>
                      <small>
                        {selected
                          ? `L${selected.level} · ${selected.games} เกม`
                          : "ยังไม่ได้เลือก"}
                      </small>
                    </span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
function Notice({
  message,
  onClose,
  floating = false,
}: {
  message: string;
  onClose: () => void;
  floating?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`notice ${floating ? "notice-floating" : ""}`}
    >
      <Check size={17} className="mt-0.5 shrink-0 text-lime-pop" />
      <span>{message}</span>
      <button
        aria-label="ปิดข้อความ"
        onClick={onClose}
        className="ml-auto flex size-7 shrink-0 items-center justify-center"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function App() {
  const c = useCourtMate();
  const installation = useInstall();
  const titles = {
    group: "จัดก๊วนของคุณ",
    play: "คู่พร้อม คอร์ทพร้อม!",
    cost: "จบเกม เคลียร์ง่าย",
  };
  const modalTitles = {
    group: c.groupCreated ? "เปลี่ยนชื่อก๊วน" : "สร้างก๊วนใหม่",
    player: c.editingPlayerId !== null ? "แก้ไขผู้เล่น" : "เพิ่มเพื่อนเข้าก๊วน",
    playerActions: "จัดการผู้เล่น",
    expense: "เพิ่มค่าใช้จ่าย",
    costSettings: "ตั้งค่าค่าใช้จ่าย",
    playSettings: "รูปแบบการจับคู่",
    custom: "เลือกคู่ด้วยตัวเอง",
    editMatch: `แก้ไขผู้เล่นคอร์ท ${c.editingMatchId}`,
    billDetails: "วิธีคิดราคาต่อเกม",
    image: "รูปสรุปพร้อมแชร์",
    reset: "เริ่มก๊วนใหม่?",
    install: "เพิ่ม CourtMate ลงเครื่อง",
  };
  const estimate =
    Math.round(
      (c.costInput.minutes * c.costInput.courts * c.costInput.courtRateCents) /
        60,
    ) +
    c.costInput.shuttleCostCents +
    c.costInput.extras.reduce((sum, e) => sum + e.cents, 0);
  const close = () => c.setModal(null);
  const mainAction =
    c.step === "group"
      ? {
          label:
            c.players.length < 4
              ? `เพิ่มอีก ${4 - c.players.length} คน เพื่อเริ่มเกม`
              : "ไปจับคู่เล่น",
          icon: ArrowRight,
          disabled: c.players.length < 4,
          action: () => c.go("play"),
        }
      : c.step === "play"
        ? {
            label: c.active
              ? "จบเกมในคอร์ทด้านบนก่อน"
              : c.round
                ? "จัดคู่รอบถัดไป"
                : "จัดคู่พร้อมลงสนาม",
            icon: Shuffle,
            disabled: c.active || c.available < c.courts * 4,
            action: () =>
              c.mode === "custom" ? c.setModal("custom") : c.prepare(),
          }
        : c.summary
          ? {
              label: c.imageBusy ? "กำลังสร้างรูป..." : "สร้างรูปสรุป / แชร์",
              icon: ImageIcon,
              disabled: c.imageBusy,
              action: () => void c.openImage(),
            }
          : {
              label: c.calculating ? "กำลังคำนวณ..." : "คำนวณค่าใช้จ่าย",
              icon: Wallet,
              disabled: c.active || !c.totalPlayerGames || c.calculating,
              action: () => void c.calculate(),
            };
  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            onClick={() => c.go("group")}
            className="flex items-center gap-2.5 text-left font-semibold"
            aria-label="CourtMate หน้าจัดก๊วน"
          >
            <span className="brand-mark">
              <Shuttle className="h-7 w-6 rotate-[28deg] text-white" />
            </span>
            <span className="brand-name">
              CourtMate
              <small className="brand-tagline">เพื่อนครบ คู่พร้อม</small>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="version-badge hidden sm:inline">v0.8.1</span>
            {!installation.installed && (
              <button
                className="install-header-button"
                onClick={() => c.setModal("install")}
                aria-label="ติดตั้ง CourtMate"
              >
                <Smartphone size={16} aria-hidden="true" />
                ติดตั้ง
              </button>
            )}
            <button
              className="icon-btn"
              aria-label="เริ่มก๊วนใหม่"
              onClick={() => c.setModal("reset")}
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </div>
      </header>
      <main className="app-workspace">
        <div className="screen-heading">
          <div>
            <p className="eyebrow">
              {c.step === "group"
                ? "01 / YOUR CREW"
                : c.step === "play"
                  ? "02 / ON COURT"
                  : "03 / SPLIT THE BILL"}
            </p>
            <h1>{titles[c.step]}</h1>
          </div>
          <span
            className="step-counter"
            aria-label={`ขั้นตอน ${steps.findIndex((s) => s.id === c.step) + 1} จาก 3`}
          >
            <strong>0{steps.findIndex((s) => s.id === c.step) + 1}</strong>
            <span>/ 03</span>
          </span>
        </div>
        <div className="screen-content">
          {c.step === "group" &&
            (!c.groupCreated ? (
              <section className="welcome-card">
                <div className="welcome-art">
                  <img
                    src="./art/badminton-player.webp"
                    alt="ผู้เล่นแบดมินตันใต้ท้องฟ้าสีฟ้า"
                    width="960"
                    height="640"
                    fetchPriority="high"
                  />
                </div>
                <div className="welcome-copy">
                  <p>เพื่อนครบ คู่พร้อม</p>
                  <h2>วันนี้ไปตีแบดกัน!</h2>
                  <p>สร้างก๊วน จัดคู่ หารค่าใช้จ่ายในที่เดียว</p>
                </div>
                <div
                  className="welcome-features"
                  aria-label="เริ่มง่ายในสามขั้นตอน"
                >
                  <span>
                    <Users size={23} aria-hidden="true" />
                    <strong>รวมเพื่อน</strong>
                  </span>
                  <span>
                    <Shuffle size={23} aria-hidden="true" />
                    <strong>จัดทีม</strong>
                  </span>
                  <span>
                    <Wallet size={23} aria-hidden="true" />
                    <strong>หารค่าใช้จ่าย</strong>
                  </span>
                </div>
                <button
                  className="btn btn-primary mt-5 w-full max-w-xs"
                  onClick={c.openGroup}
                >
                  <Plus size={17} />
                  สร้างก๊วนใหม่
                </button>
                <button
                  onClick={c.sample}
                  className="mt-3 flex min-h-10 items-center justify-center gap-1.5 text-xs text-muted"
                >
                  <Sparkles size={14} />
                  ลองด้วยรายชื่อตัวอย่าง
                </button>
              </section>
            ) : (
              <section className="roster-screen">
                <img
                  className="scene-strip"
                  src="./art/badminton-duo.webp"
                  alt=""
                  width="960"
                  height="640"
                />
                <div className="club-strip">
                  <div className="min-w-0">
                    <span className="eyebrow">MY CREW</span>
                    <h2 className="truncate">{c.groupName}</h2>
                  </div>
                  <button
                    aria-label="เปลี่ยนชื่อก๊วน"
                    className="icon-btn"
                    onClick={c.openGroup}
                  >
                    <Settings2 size={17} />
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={c.openNewPlayer}
                    disabled={c.players.length >= MAX_PLAYERS}
                  >
                    <Plus size={15} />
                    เพิ่มคน
                  </button>
                </div>
                <div className="list-heading">
                  <h3>
                    เพื่อนร่วมก๊วน <span>{c.players.length} คน</span>
                  </h3>
                  <span className="text-xs text-muted">
                    แตะการ์ดเพื่อจัดการ
                  </span>
                </div>
                <div className="panel-scroll" aria-label="รายชื่อผู้เล่น">
                  {c.players.length ? (
                    <div className="skill-groups">
                      {levelNames.slice(1).map((label, index) => {
                        const skill = index + 1;
                        const members = c.players.filter(
                          (p) => p.level === skill,
                        );
                        if (!members.length) return null;
                        return (
                          <section
                            className="skill-group"
                            key={skill}
                            aria-labelledby={`skill-heading-${skill}`}
                          >
                            <div className="skill-group-heading">
                              <h3 id={`skill-heading-${skill}`}>
                                <span
                                  className={`skill-number skill-tone-${skill}`}
                                >
                                  L{skill}
                                </span>
                                <span>{label}</span>
                              </h3>
                              <span>{members.length} คน</span>
                            </div>
                            <div className="roster-grid">
                              {members.map((p) => (
                                <button
                                  type="button"
                                  className="player-cell"
                                  key={p.id}
                                  aria-label={`จัดการ ${p.name}`}
                                  aria-haspopup="dialog"
                                  onClick={() => c.openPlayerActions(p.id)}
                                  title={p.name}
                                >
                                  <Avatar p={p} />
                                  <span className="player-cell-info">
                                    <strong>{p.name}</strong>
                                    <small>{p.games} เกมที่เล่น</small>
                                  </span>
                                  <MoreHorizontal
                                    size={15}
                                    className="player-cell-menu"
                                  />
                                </button>
                              ))}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-panel">
                      <Users size={36} />
                      <h3>ก๊วนสร้างแล้ว เพิ่มเพื่อนกันเลย</h3>
                      <p>แตะ “เพิ่มคน” ด้านบนเพื่อเริ่มรายชื่อ</p>
                      <button
                        className="btn btn-secondary mt-5"
                        onClick={c.openNewPlayer}
                      >
                        <Plus size={16} />
                        เพิ่มผู้เล่นคนแรก
                      </button>
                    </div>
                  )}
                </div>
                <div className="screen-note">
                  ครบ 4 คนเริ่มเล่นได้ · รายชื่ออยู่เฉพาะระหว่างเปิดหน้านี้
                </div>
              </section>
            ))}

          {c.step === "play" && (
            <section className="play-screen">
              <img
                className="scene-strip"
                src="./art/badminton-duo.webp"
                alt=""
                width="960"
                height="640"
              />
              <div className="club-strip !py-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate !text-sm">
                    {c.groupName || "ก๊วนของเรา"}
                  </h2>
                  <p className="crew-meta">
                    {c.players.length} คน · เล่นจบ {c.history.length} เกม · รอบ{" "}
                    {c.round || "—"}
                  </p>
                </div>
                <button
                  aria-label="ตั้งค่าการจับคู่"
                  className="settings-chip"
                  disabled={c.active}
                  onClick={() => c.setModal("playSettings")}
                >
                  <Settings2 size={14} />
                  {c.mode === "auto" ? "Auto" : "Custom"}
                  <span aria-hidden="true">/</span>
                  {c.courts} คอร์ท
                </button>
              </div>
              <div
                className="view-tabs"
                role="tablist"
                aria-label="ข้อมูลรอบเล่น"
              >
                {(
                  [
                    {
                      id: "courts",
                      label: "คอร์ทเล่น",
                      count: c.matches.length,
                    },
                    {
                      id: "players",
                      label: "ผู้เล่น",
                      count: c.players.length,
                    },
                    {
                      id: "history",
                      label: "ประวัติ",
                      count: c.history.length,
                    },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    role="tab"
                    aria-label={
                      v.id === "players" ? `ผู้เล่น ${v.count} คน` : undefined
                    }
                    aria-selected={c.playView === v.id}
                    onClick={() => c.setPlayView(v.id)}
                    className={c.playView === v.id ? "selected" : ""}
                  >
                    {v.label}
                    <span>
                      {v.count}
                      {v.id === "players" ? " คน" : ""}
                    </span>
                  </button>
                ))}
              </div>
              <div
                className="panel-scroll"
                role="tabpanel"
                aria-label={
                  c.playView === "courts"
                    ? "คอร์ทเล่น"
                    : c.playView === "players"
                      ? "จำนวนเกมของผู้เล่น"
                      : "ประวัติเกม"
                }
              >
                {c.playView === "courts" &&
                  (c.matches.length ? (
                    <div className="court-grid">
                      {c.matches.map((m) => (
                        <article
                          className={`court-card ${m.done ? "finished" : ""}`}
                          key={m.id}
                        >
                          <div className="court-card-heading">
                            <span>COURT {String(m.id).padStart(2, "0")}</span>
                            <div className="flex items-center gap-1">
                              <span>
                                {m.done ? "จบเกมแล้ว" : "พร้อมลงสนาม"}
                              </span>
                              {!m.done && (
                                <>
                                  <button
                                    className="court-edit-button"
                                    aria-label={`แก้ไขผู้เล่นคอร์ท ${m.id}`}
                                    title="แก้ไขผู้เล่นก่อนจบเกม"
                                    onClick={() => c.openEditMatch(m.id)}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    className="court-edit-button"
                                    aria-label={`ยกเลิกคอร์ท ${m.id}`}
                                    title="ยกเลิก ไม่นับเกม"
                                    onClick={() => c.cancelMatch(m.id)}
                                  >
                                    <X size={17} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="teams-row">
                            {[m.a, m.b].map((team, t) => (
                              <div
                                key={t}
                                className={`court-team court-team-${t === 0 ? "a" : "b"}`}
                              >
                                <span className="text-xs opacity-60">
                                  ทีม {t === 0 ? "A" : "B"}
                                </span>
                                {team.map((pid) => {
                                  const p = c.players.find(
                                    (p) => p.id === pid,
                                  )!;
                                  return (
                                    <div
                                      key={pid}
                                      className="flex min-w-0 items-center gap-2"
                                    >
                                      <Avatar p={p} />
                                      <div className="min-w-0">
                                        <strong className="block truncate text-xs font-medium">
                                          {p.name}
                                        </strong>
                                        <span className="text-xs opacity-55">
                                          L{p.level} · {p.games} เกม
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                            <span className="vs-label">VS</span>
                          </div>
                          <button
                            className="finish-button"
                            disabled={m.done}
                            onClick={() => c.finish(m)}
                          >
                            {m.done ? <Check size={16} /> : <Flag size={16} />}{" "}
                            {m.done
                              ? "เพิ่มจำนวนเกมแล้ว"
                              : `จบเกมคอร์ท ${m.id} · นับเกม`}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-panel">
                      <Shuttle className="h-20 w-16 rotate-[25deg] text-muted" />
                      <h3>พร้อมลงสนามกันหรือยัง?</h3>
                      <p>
                        เลือก Auto หรือ Custom จากปุ่มตั้งค่าด้านบน
                        <br />
                        แล้วแตะ “จัดคู่พร้อมลงสนาม”
                      </p>
                      <span className="mt-4 rounded-lg bg-club-50 px-3 py-2 text-xs text-muted">
                        Auto ให้คนที่เล่นน้อยได้ลงก่อน
                      </span>
                    </div>
                  ))}
                {c.playView === "players" && (
                  <div className="rounded-xl border border-[#e2e9da] bg-white px-3">
                    <div className="flex justify-between border-b border-[#e9eee1] py-3 text-xs text-muted">
                      <span>ผู้เล่น / Level</span>
                      <span>เกม / พร้อมเล่น</span>
                    </div>
                    {[...c.players]
                      .sort((a, b) => a.games - b.games || a.id - b.id)
                      .map((p) => (
                        <div className="count-row" key={p.id}>
                          <Avatar p={p} />
                          <div className="min-w-0 flex-1">
                            <button
                              className="flex max-w-full items-center gap-1 text-left"
                              aria-label={`แก้ไข ${p.name}`}
                              onClick={() => c.openEditPlayer(p.id)}
                            >
                              <strong className="block truncate text-xs font-medium">
                                {p.name}
                              </strong>
                              <Pencil
                                size={11}
                                className="shrink-0 text-muted"
                              />
                            </button>
                            <small>
                              L{p.level} · {levelNames[p.level]}
                            </small>
                          </div>
                          <strong className="min-w-8 text-center text-xl font-medium">
                            {p.games}
                          </strong>
                          <button
                            role="switch"
                            aria-label={`พร้อมเล่น ${p.name}`}
                            aria-checked={p.available}
                            onClick={() =>
                              c.setPlayers((ps) =>
                                ps.map((x) =>
                                  x.id === p.id
                                    ? { ...x, available: !x.available }
                                    : x,
                                ),
                              )
                            }
                            className="ready-switch"
                          >
                            <span>
                              <i />
                            </span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                {c.playView === "history" &&
                  (c.history.length ? (
                    <div className="rounded-xl border border-[#e2e9da] bg-white p-4">
                      <button
                        className="mb-2 flex min-h-10 items-center gap-1.5 text-xs text-club-600"
                        onClick={c.undo}
                      >
                        <RotateCcw size={14} />
                        ย้อนเกมล่าสุด
                      </button>
                      {[...c.history].reverse().map((h) => (
                        <div
                          className="border-t border-[#e9eee1] py-3"
                          key={h.id}
                        >
                          <span className="text-xs text-muted">
                            รอบ {h.round} / คอร์ท {h.match.id}
                          </span>
                          <p className="mt-1 text-xs leading-6">
                            {h.match.a.map(c.nameFor).join(" + ")}{" "}
                            <span className="mx-1 text-xs text-muted">VS</span>{" "}
                            {h.match.b.map(c.nameFor).join(" + ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-panel">
                      <Flag size={32} />
                      <h3>ยังไม่มีเกมที่เล่นจบ</h3>
                      <p>กด “จบเกม” ที่คอร์ท แล้วประวัติจะอยู่ตรงนี้</p>
                    </div>
                  ))}
              </div>
              <div className="screen-note">
                {c.available < c.courts * 4
                  ? `พร้อมเล่น ${c.available} คน ต้องการ ${c.courts * 4} คน`
                  : c.playView === "players"
                    ? "ปิดพร้อมเล่นเมื่อพัก · นับเฉพาะเกมที่กดจบแล้ว"
                    : "แตะ “ผู้เล่น” เพื่อดูจำนวนเกมและเลือกคนที่พร้อมเล่น"}
              </div>
            </section>
          )}

          {c.step === "cost" && (
            <section
              className={`cost-screen ${c.summary ? "has-summary" : ""}`}
            >
              <CourtArt />
              <div className="cost-banner">
                <div>
                  <span className="text-xs text-muted">ค่าใช้จ่ายทั้งหมด</span>
                  <p className="mt-0.5 text-[30px] font-semibold leading-tight tracking-tight">
                    ฿{baht(c.summary?.bill.totalCents || estimate)}
                  </p>
                  <span className="mt-2 block text-xs text-muted">
                    {c.costFields.hours} ชม. · {c.costFields.courts} คอร์ท · ฿
                    {c.costFields.rate}/คอร์ท/ชม.
                  </span>
                </div>
                <button
                  aria-label="ตั้งค่าค่าใช้จ่าย"
                  onClick={() => c.setModal("costSettings")}
                  className="cost-settings-button"
                >
                  <Settings2 size={20} />
                </button>
              </div>
              <div className="expense-chips">
                <button
                  onClick={() => {
                    c.setExpenseName("");
                    c.setExpenseAmount("");
                    c.setModal("expense");
                  }}
                  disabled={c.extras.length >= 20}
                  className="add-expense-chip"
                >
                  <Plus size={13} />
                  เพิ่มค่าใช้จ่าย
                </button>
                <span>ลูกแบด ฿{c.costFields.shuttle}</span>
                {c.extras.map((e) => (
                  <span key={e.id}>
                    {e.name} ฿{e.amount}
                    <button
                      aria-label={`ลบค่าใช้จ่าย ${e.name}`}
                      onClick={() => {
                        c.setExtras((es) => es.filter((x) => x.id !== e.id));
                        c.notify("ลบค่าใช้จ่ายแล้ว");
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="list-heading">
                <h3>หารตามจำนวนเกม</h3>
                {c.summary && (
                  <button
                    className="flex min-h-11 items-center gap-1 rounded-lg bg-club-50 px-2 text-xs text-club-600"
                    onClick={() => c.setModal("billDetails")}
                    aria-label="ดูวิธีคิดราคาต่อเกม"
                  >
                    ฿{baht(gameRate(c.summary.bill))}/คน/เกม{" "}
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
              <div className="panel-scroll">
                {c.summary ? (
                  <div className="bill-table-wrap">
                    <table className="bill-table">
                      <caption className="sr-only">ตารางหารค่าใช้จ่าย</caption>
                      <thead>
                        <tr>
                          <th>ผู้เล่น</th>
                          <th>เกม</th>
                          <th>ยอดชำระ (บาท)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.summary.bill.rows.map((p) => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.games}</td>
                            <td>{baht(p.cents)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan={2}>รวม</th>
                          <td>{baht(c.summary.bill.totalCents)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="empty-panel !min-h-0">
                    <Wallet size={34} />
                    <h3>
                      {c.active
                        ? "ยังมีเกมที่กำลังเล่น"
                        : !c.totalPlayerGames
                          ? "เล่นให้จบก่อน แล้วมาหารกัน"
                          : "ข้อมูลพร้อม คำนวณได้เลย"}
                    </h3>
                    <p>
                      {c.active
                        ? "จบเกมในคอร์ทให้ครบก่อนสรุปค่าใช้จ่าย"
                        : !c.totalPlayerGames
                          ? "กลับไปจับคู่ แล้วกดจบเกมหลังเล่นจริง"
                          : "ตั้งค่าค่าสนาม ลูกแบด หรือเพิ่มรายการอื่น\nแล้วแตะคำนวณด้านล่าง"}
                    </p>
                    {(c.active || !c.totalPlayerGames) && (
                      <button
                        className="btn btn-secondary mt-4"
                        onClick={() => c.go("play")}
                      >
                        ไปหน้าจับคู่
                        <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="screen-note">
                เล่น 0 เกม จ่าย 0 บาท · ยอดรวม × เกมของคุณ ÷ เกมของทุกคน
              </div>
            </section>
          )}
        </div>
        {(c.step !== "group" || c.groupCreated) && (
          <div className="primary-action">
            <button
              className="btn btn-primary w-full"
              disabled={mainAction.disabled}
              onClick={mainAction.action}
            >
              <mainAction.icon size={18} />
              {mainAction.label}
            </button>
          </div>
        )}
      </main>
      <nav className="app-navigation" aria-label="เมนูหลัก">
        {steps.map((s, i) => (
          <button
            key={s.id}
            aria-current={c.step === s.id ? "page" : undefined}
            onClick={() => c.go(s.id)}
            className={c.step === s.id ? "active" : ""}
          >
            <span>
              <s.icon size={19} />
            </span>
            <strong>{s.label}</strong>
            <small>0{i + 1}</small>
          </button>
        ))}
      </nav>
      {c.toast && !c.modal && (
        <Notice message={c.toast} onClose={() => c.setToast("")} floating />
      )}

      <dialog
        ref={c.dialog}
        aria-labelledby="dialog-title"
        className={`compact-dialog ${c.modal === "image" ? "image-dialog" : ""}`}
        onCancel={close}
        onClick={(e) => {
          if (e.target === c.dialog.current) close();
        }}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">COURTMATE CLUBHOUSE</p>
            <h2 id="dialog-title">{c.modal ? modalTitles[c.modal] : ""}</h2>
          </div>
          <button aria-label="ปิดหน้าต่าง" className="icon-btn" onClick={close}>
            <X size={19} />
          </button>
        </div>
        {c.toast && c.modal && (
          <div className="px-5 pt-3">
            <Notice message={c.toast} onClose={() => c.setToast("")} />
          </div>
        )}
        <div className="dialog-body">
          {c.modal === "install" && (
            <div className="install-guide">
              <div className="install-intro">
                <img src="./icons/icon-192.png" alt="" width="56" height="56" />
                <div>
                  <h3>CourtMate</h3>
                  <p>แตะไอคอนบนหน้าจอหลัก แล้วเริ่มจัดก๊วนได้เลย</p>
                </div>
              </div>
              {installation.installed ? (
                <p className="install-status">
                  <Check size={18} aria-hidden="true" />
                  เปิดในโหมดแอปแล้ว
                </p>
              ) : (
                (installation.available || installation.busy) && (
                  <button
                    className="btn btn-primary w-full"
                    disabled={installation.busy}
                    onClick={async () => {
                      const outcome = await installation.install();
                      if (outcome === "accepted") {
                        close();
                        c.notify(
                          "ยืนยันการติดตั้งแล้ว เปิดจากไอคอน CourtMate หลังติดตั้งเสร็จ",
                        );
                      } else if (outcome === "failed")
                        c.notify(
                          "เปิดหน้าติดตั้งไม่ได้ ใช้วิธีเพิ่มหน้าจอหลักด้านล่างได้ครับ",
                        );
                    }}
                  >
                    <Download size={17} aria-hidden="true" />
                    {installation.busy
                      ? "กำลังเปิดหน้าติดตั้ง..."
                      : "ติดตั้ง CourtMate"}
                  </button>
                )
              )}
              {!installation.installed && (
                <>
                  <section className="install-platform">
                    <h3>iPhone / iPad</h3>
                    <ol>
                      <li>เปิดเว็บนี้ใน Safari</li>
                      <li>แตะเมนูแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”</li>
                      <li>เปิด “เปิดเป็นเว็บแอป” หากมี แล้วแตะ “เพิ่ม”</li>
                    </ol>
                  </section>
                  <section className="install-platform">
                    <h3>Android</h3>
                    <p>
                      เปิดใน Chrome แตะเมนู ⋮ แล้วเลือก “ติดตั้งแอป” หรือ
                      “เพิ่มลงในหน้าจอหลัก”
                    </p>
                  </section>
                  <section className="install-platform">
                    <h3>คอมพิวเตอร์</h3>
                    <p>
                      เปิดใน Chrome หรือ Edge แล้วเลือกไอคอนติดตั้งที่แถบที่อยู่
                      หรือเมนูติดตั้งแอปของเบราว์เซอร์
                    </p>
                  </section>
                </>
              )}
              <p className="install-note">
                ใช้เน็ตเมื่อเปิดแอป · รายชื่อและเกมอยู่เฉพาะรอบที่เปิดใช้งาน
                การติดตั้งไม่ได้เก็บข้อมูลไว้หลังปิดหรือรีโหลด
              </p>
            </div>
          )}
          {c.modal === "group" && (
            <form onSubmit={c.createGroup}>
              <Label title="ชื่อก๊วน">
                <input
                  autoFocus
                  className="field"
                  placeholder="เช่น ก๊วนหลังเลิกงาน"
                  required
                  maxLength={50}
                  value={c.groupDraft}
                  onChange={(e) => c.setGroupDraft(e.target.value)}
                />
              </Label>
              <p className="mt-3 text-xs leading-6 text-muted">
                ชื่อก๊วนใช้กับรอบเล่นนี้และรูปสรุปค่าใช้จ่าย
              </p>
              <button className="btn btn-primary mt-5 w-full">
                <Check size={17} />
                {c.groupCreated ? "ใช้ชื่อนี้" : "สร้างก๊วน"}
              </button>
            </form>
          )}
          {c.modal === "playerActions" && c.selectedPlayer && (
            <div className="player-actions">
              <div className="selected-player">
                <Avatar p={c.selectedPlayer} />
                <div className="min-w-0">
                  <h3 className="break-words text-base font-medium">
                    {c.selectedPlayer.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Level {c.selectedPlayer.level} ·{" "}
                    {levelNames[c.selectedPlayer.level]} ·{" "}
                    {c.selectedPlayer.games} เกม
                  </p>
                </div>
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={() => c.openEditPlayer(c.selectedPlayer!.id)}
              >
                <Pencil size={17} />
                แก้ไขชื่อ / Level
              </button>
              <button
                className="btn player-delete-button w-full"
                disabled={c.selectedPlayer.games > 0}
                onClick={() => {
                  c.removePlayer(c.selectedPlayer!.id);
                  close();
                }}
              >
                <Trash2 size={17} />
                ลบผู้เล่น
              </button>
              {c.selectedPlayer.games > 0 ? (
                <p className="player-action-note">
                  ผู้เล่นมีเกมที่เล่นจบแล้ว แก้ชื่อและ Level ได้
                  แต่เก็บรายชื่อไว้เพื่อให้ยอดหารครบ
                </p>
              ) : (
                c.matches.some(
                  (m) =>
                    !m.done && [...m.a, ...m.b].includes(c.selectedPlayer!.id),
                ) && (
                  <p className="player-action-note">
                    ผู้เล่นอยู่ในคอร์ทที่ยังไม่จบ
                    หากลบจะยกเลิกคอร์ทที่เกี่ยวข้องโดยไม่นับเกม
                  </p>
                )
              )}
            </div>
          )}
          {c.modal === "player" && (
            <form onSubmit={c.addPlayer}>
              <Label title="ชื่อเล่นของเพื่อน">
                <input
                  autoFocus
                  className="field"
                  placeholder="ชื่อที่เรียกกันในก๊วน"
                  required
                  maxLength={40}
                  value={c.name}
                  onChange={(e) => c.setName(e.target.value)}
                  disabled={
                    c.editingPlayerId === null &&
                    c.players.length >= MAX_PLAYERS
                  }
                />
              </Label>
              <div className="mt-4">
                <Label title="ระดับฝีมือ / Level">
                  <select
                    className="field"
                    aria-label="ระดับฝีมือของผู้เล่นใหม่"
                    value={c.level}
                    onChange={(e) => c.setLevel(Number(e.target.value))}
                  >
                    {levelNames.slice(1).map((l, i) => (
                      <option key={l} value={i + 1}>
                        Level {i + 1} · {l}
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted">
                {c.editingPlayerId !== null
                  ? "แก้ชื่อและ Level ได้ โดยจำนวนเกมเดิมไม่เปลี่ยน"
                  : `มี ${c.players.length} คนในก๊วน · เพิ่มต่อได้ทันทีหลังสำเร็จ`}
              </p>
              <div className="mt-5 grid grid-cols-[1fr_1.7fr] gap-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={close}
                >
                  เสร็จแล้ว
                </button>
                <button
                  className="btn btn-primary"
                  disabled={
                    c.editingPlayerId === null &&
                    c.players.length >= MAX_PLAYERS
                  }
                >
                  {c.editingPlayerId !== null ? (
                    <Check size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {c.editingPlayerId !== null
                    ? "ยืนยันการแก้ไข"
                    : "เพิ่มผู้เล่น"}
                </button>
              </div>
            </form>
          )}
          {c.modal === "expense" && (
            <form onSubmit={c.addExpense}>
              <Label title="ชื่อรายการ">
                <input
                  className="field"
                  autoFocus
                  required
                  maxLength={60}
                  placeholder="เช่น น้ำดื่ม"
                  value={c.expenseName}
                  onChange={(e) => c.setExpenseName(e.target.value)}
                />
              </Label>
              <div className="mt-4">
                <Label title="จำนวนเงิน (บาท)">
                  <input
                    className="field"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000"
                    step="0.01"
                    required
                    value={c.expenseAmount}
                    onChange={(e) => c.setExpenseAmount(e.target.value)}
                  />
                </Label>
              </div>
              <button className="btn btn-primary mt-5 w-full">
                <Plus size={17} />
                เพิ่มรายการ
              </button>
            </form>
          )}
          {c.modal === "costSettings" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                close();
                c.notify("ตั้งค่าค่าใช้จ่ายสำเร็จ");
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <Label title="จำนวนชั่วโมง">
                  <input
                    className="field"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="24"
                    step="0.25"
                    required
                    value={c.costFields.hours}
                    onChange={(e) =>
                      c.setCostFields((f) => ({ ...f, hours: e.target.value }))
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
                    value={c.costFields.courts}
                    onChange={(e) =>
                      c.setCostFields((f) => ({ ...f, courts: e.target.value }))
                    }
                  />
                </Label>
              </div>
              <div className="mt-4">
                <Label title="ค่าสนาม / คอร์ท / ชั่วโมง (บาท)">
                  <input
                    className="field"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000"
                    step="0.01"
                    required
                    value={c.costFields.rate}
                    onChange={(e) =>
                      c.setCostFields((f) => ({ ...f, rate: e.target.value }))
                    }
                  />
                </Label>
              </div>
              <div className="mt-4">
                <Label title="ค่าลูกแบดรวม (บาท)">
                  <input
                    className="field"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000"
                    step="0.01"
                    required
                    value={c.costFields.shuttle}
                    onChange={(e) =>
                      c.setCostFields((f) => ({
                        ...f,
                        shuttle: e.target.value,
                      }))
                    }
                  />
                </Label>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted">
                ค่าสนาม = ชั่วโมง × คอร์ท × ราคาต่อชั่วโมง
              </p>
              <button className="btn btn-primary mt-5 w-full">
                <Check size={17} />
                ใช้ค่าใช้จ่ายนี้
              </button>
            </form>
          )}
          {c.modal === "playSettings" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                close();
                c.notify("ตั้งค่าการจับคู่สำเร็จ");
              }}
            >
              <Label title="รูปแบบการจับคู่">
                <select
                  className="field"
                  value={c.mode}
                  onChange={(e) =>
                    c.setMode(e.target.value as "auto" | "custom")
                  }
                  disabled={c.active}
                >
                  <option value="auto">Auto · จัดให้อัตโนมัติ</option>
                  <option value="custom">Custom · เลือกคู่เอง</option>
                </select>
              </Label>
              <div className="mt-4">
                <Label title="จำนวนคอร์ทที่เล่นพร้อมกัน">
                  <select
                    aria-label="จำนวนคอร์ทจับคู่"
                    className="field"
                    disabled={c.active}
                    value={c.courts}
                    onChange={(e) => {
                      c.setCourts(Number(e.target.value));
                      c.setSlots(Array(Number(e.target.value) * 4).fill(0));
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} คอร์ท · {n * 4} คน
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted">
                Auto ให้คนที่เล่นน้อยได้ลงก่อน แล้วบาลานซ์ Level
                ของแต่ละคู่ภายในคอร์ท
              </p>
              <button className="btn btn-primary mt-5 w-full">
                <Check size={17} />
                ใช้รูปแบบนี้
              </button>
            </form>
          )}
          {c.modal === "custom" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                c.prepare();
              }}
            >
              <div className="space-y-4">
                {Array.from({ length: c.courts }, (_, court) => (
                  <section
                    className="rounded-xl border border-[#e3eadb] p-3"
                    key={court}
                  >
                    <h3 className="mb-3 text-xs font-medium text-muted">
                      คอร์ท {court + 1}
                    </h3>
                    <TeamPicker
                      values={c.slots.slice(court * 4, court * 4 + 4)}
                      players={c.players}
                      labelFor={(slot) =>
                        `คอร์ท ${court + 1} ทีม ${slot < 2 ? "A" : "B"} คนที่ ${(slot % 2) + 1}`
                      }
                      optionsFor={(slot) =>
                        c.players.filter(
                          (p) =>
                            p.available &&
                            (!c.slots.includes(p.id) ||
                              c.slots[court * 4 + slot] === p.id),
                        )
                      }
                      onChange={(slot, id) =>
                        c.setSlots((values) =>
                          values.map((v, i) =>
                            i === court * 4 + slot ? id : v,
                          ),
                        )
                      }
                    />
                  </section>
                ))}
              </div>
              <button className="btn btn-primary mt-5 w-full">
                <Check size={17} />
                ยืนยันคู่ลงสนาม
              </button>
            </form>
          )}
          {c.modal === "editMatch" && (
            <form onSubmit={c.applyMatchEdit}>
              <p className="mb-4 text-xs leading-6 text-muted">
                เปลี่ยนผู้เล่นได้ก่อนจบเกม
                คนในคอร์ทอื่นที่ยังเล่นอยู่จะไม่อยู่ในตัวเลือก
              </p>
              <TeamPicker
                values={c.matchDraft}
                players={c.players}
                labelFor={(index) =>
                  `แก้ทีม ${index < 2 ? "A" : "B"} คนที่ ${(index % 2) + 1}`
                }
                optionsFor={(index) =>
                  c.players.filter(
                    (p) =>
                      (p.available || c.matchDraft.includes(p.id)) &&
                      (!c.matchDraft.includes(p.id) ||
                        c.matchDraft[index] === p.id) &&
                      !c.matches.some(
                        (m) =>
                          m.id !== c.editingMatchId &&
                          !m.done &&
                          [...m.a, ...m.b].includes(p.id),
                      ),
                  )
                }
                onChange={(index, id) =>
                  c.setMatchDraft((ids) =>
                    ids.map((value, i) => (i === index ? id : value)),
                  )
                }
              />
              <button className="btn btn-primary mt-5 w-full">
                <Check size={16} />
                ยืนยันผู้เล่นคอร์ทนี้
              </button>
            </form>
          )}
          {c.modal === "billDetails" && c.summary && (
            <div className="billing-details">
              <p className="caption">รายการรวมทั้งหมด</p>
              {[
                ["ค่าสนาม", c.summary.bill.courtCents],
                ["ค่าลูกแบด", c.summary.costs.shuttleCostCents],
                ...c.summary.costs.extras.map((e) => [e.name, e.cents]),
              ].map(([label, cents], i) => (
                <div
                  className="flex justify-between gap-4 py-2 text-xs text-muted"
                  key={i}
                >
                  <span className="min-w-0 break-words">{label}</span>
                  <strong className="shrink-0 font-medium">
                    ฿{baht(Number(cents))}
                  </strong>
                </div>
              ))}
              <div className="rate-formula">
                <span>
                  {[
                    c.summary.bill.courtCents,
                    c.summary.costs.shuttleCostCents,
                    ...c.summary.costs.extras.map((e) => e.cents),
                  ]
                    .filter((v) => v !== 0)
                    .map((v) => baht(v))
                    .join(" + ") || "0.00"}{" "}
                  = {baht(c.summary.bill.totalCents)} บาท
                </span>
                <strong>
                  {baht(c.summary.bill.totalCents)} ÷{" "}
                  {c.summary.bill.totalGames} = {baht(gameRate(c.summary.bill))}{" "}
                  บาท
                </strong>
                <span>ราคาเฉลี่ยต่อคนต่อเกม · หารด้วยผลรวมเกมของผู้เล่น</span>
              </div>
              <p className="mt-4 text-xs leading-6 text-muted">
                1 แมตช์ประเภทคู่ = ผู้เล่น 4 คน × คนละ 1 เกม
                <br />
                เล่นจบ {c.history.length} แมตช์ = ผลรวมเกมของผู้เล่น{" "}
                {c.summary.bill.totalGames}
              </p>
              <div className="mt-4 space-y-2">
                {c.summary.bill.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 break-words">
                      {row.name} · {row.games} ×{" "}
                      {baht(gameRate(c.summary!.bill))}
                    </span>
                    <strong className="shrink-0 font-medium">
                      ฿{baht(row.cents)}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-muted">
                ราคาเฉลี่ยแสดงทศนิยม 2 ตำแหน่ง คำนวณจริงก่อนปัดเศษรายคน
                แล้วกระจายเศษสตางค์ให้ยอดรวมตรงกัน
              </p>
            </div>
          )}
          {c.modal === "image" && (
            <img
              src={c.imageUrl}
              alt="รูปตารางสรุปค่าใช้จ่ายตามจำนวนเกม"
              className="h-auto w-full rounded-lg"
            />
          )}
          {c.modal === "reset" && (
            <>
              <p className="text-sm leading-7 text-muted">
                รายชื่อ จำนวนเกม และค่าใช้จ่ายรอบนี้จะถูกล้าง
                ดาวน์โหลดรูปสรุปก่อนเริ่มใหม่นะ
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button className="btn btn-secondary" onClick={close}>
                  กลับไปก่อน
                </button>
                <button className="btn btn-primary" onClick={c.reset}>
                  เริ่มก๊วนใหม่
                </button>
              </div>
            </>
          )}
        </div>
        {c.modal === "image" && (
          <div className="dialog-footer">
            <button className="btn btn-secondary" onClick={c.download}>
              <Download size={16} />
              ดาวน์โหลด PNG
            </button>
            <button className="btn btn-primary" onClick={c.share}>
              <Share2 size={16} />
              แชร์รูป
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
