import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  autoPair,
  calculateBill,
  completeMatch,
  updatePlayer,
  cancelPendingMatch,
  replacePendingMatch,
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
const sampleNames = ["ต้น", "มิน", "เจมส์", "พลอย", "บาส", "ฟ้า", "นัท", "แพร"];
export function useCourtMate() {
  const [step, setStep] = useState<Step>("group");
  const [groupCreated, setGroupCreated] = useState(false);
  const [groupDraft, setGroupDraft] = useState("");
  const [playView, setPlayView] = useState<"courts" | "players" | "history">(
    "courts",
  );
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [groupName, setGroupName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(3);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [matchDraft, setMatchDraft] = useState<number[]>([0, 0, 0, 0]);
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
    rate: "180",
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
  const [modal, setModal] = useState<
    | "image"
    | "reset"
    | "group"
    | "player"
    | "playerActions"
    | "expense"
    | "costSettings"
    | "playSettings"
    | "custom"
    | "editMatch"
    | "billDetails"
    | "install"
    | null
  >(null);
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
    if (editingPlayerId !== null) {
      try {
        setPlayers(updatePlayer(players, editingPlayerId, trimmed, level));
        setModal(null);
        setEditingPlayerId(null);
        notify("แก้ไขชื่อและ Level ผู้เล่นสำเร็จ");
      } catch (error) {
        notify((error as Error).message);
      }
      return;
    }
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
    const nextPlayer = {
      id: id.current++,
      name: trimmed,
      level,
      games: 0,
      available: true,
    };
    setPlayers((p) => [...p, nextPlayer]);
    setName("");
    notify(`เพิ่ม ${trimmed} เข้าก๊วนสำเร็จ`);
  };
  const openNewPlayer = () => {
    setEditingPlayerId(null);
    setName("");
    setLevel(3);
    setModal("player");
  };
  const openEditPlayer = (pid: number) => {
    const player = players.find((p) => p.id === pid);
    if (!player) return;
    setEditingPlayerId(pid);
    setName(player.name);
    setLevel(player.level);
    setModal("player");
  };
  const selectedPlayer = players.find((p) => p.id === editingPlayerId);
  const openPlayerActions = (pid: number) => {
    if (!players.some((p) => p.id === pid)) return;
    setEditingPlayerId(pid);
    setModal("playerActions");
  };
  const removePlayer = (pid: number) => {
    const player = players.find((p) => p.id === pid);
    if (!player) return;
    if (player.games > 0) {
      notify(
        "ผู้เล่นมีเกมที่จบแล้ว แก้ชื่อได้ แต่ต้องเก็บจำนวนเกมไว้เพื่อหารเงิน",
      );
      return;
    }
    const affected = matches.filter(
      (m) => !m.done && [...m.a, ...m.b].includes(pid),
    );
    setMatches((ms) => ms.filter((m) => !affected.some((a) => a.id === m.id)));
    setPlayers((ps) => ps.filter((p) => p.id !== pid));
    setSlots((values) => values.map((value) => (value === pid ? 0 : value)));
    notify(
      affected.length
        ? `ลบ ${player.name} และยกเลิกคอร์ทที่เกี่ยวข้องแล้ว ไม่นับเกม`
        : `ลบ ${player.name} ออกจากก๊วนแล้ว`,
    );
  };
  const cancelMatch = (mid: number) => {
    try {
      setMatches(cancelPendingMatch(matches, mid));
      notify(`ยกเลิกคอร์ท ${mid} แล้ว ไม่นับจำนวนเกม`);
    } catch (error) {
      notify((error as Error).message);
    }
  };
  const openEditMatch = (mid: number) => {
    const match = matches.find((m) => m.id === mid && !m.done);
    if (!match) return;
    setEditingMatchId(mid);
    setMatchDraft([...match.a, ...match.b]);
    setModal("editMatch");
  };
  const applyMatchEdit = (e: FormEvent) => {
    e.preventDefault();
    if (editingMatchId === null) return;
    try {
      setMatches(
        replacePendingMatch(players, matches, editingMatchId, matchDraft),
      );
      setModal(null);
      notify("แก้ไขคู่ผู้เล่นสำเร็จ ยังไม่นับเกมจนกดจบเกม");
    } catch (error) {
      notify((error as Error).message);
    }
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
    setGroupCreated(true);
    notify("สร้างก๊วนตัวอย่างพร้อมผู้เล่น 8 คนสำเร็จ");
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
      setModal(null);
      setPlayView("courts");
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
    const current = matches.find((m) => m.id === match.id);
    if (!current || current.done) return;
    setPlayers((p) => completeMatch(p, current));
    setMatches((ms) =>
      ms.map((m) => (m.id === match.id ? { ...m, done: true } : m)),
    );
    const played = {
      id: gameId.current++,
      round,
      match: { ...current, done: true },
    };
    setHistory((h) => [...h, played]);
    notify(`จบเกมคอร์ท ${match.id} · ผู้เล่นทั้ง 4 คนเพิ่มคนละ 1 เกม`);
  };
  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    const ids = [...last.match.a, ...last.match.b];
    if (
      last.round === round &&
      matches.some(
        (m) =>
          m.id !== last.match.id &&
          !m.done &&
          [...m.a, ...m.b].some((pid) => ids.includes(pid)),
      )
    ) {
      notify(
        "ผู้เล่นอยู่ในอีกคอร์ทที่ยังไม่จบ ยกเลิกหรือแก้คอร์ทนั้นก่อนย้อนเกม",
      );
      return;
    }
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
  const calculate = async (e?: FormEvent) => {
    e?.preventDefault();
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
      notify("สร้างรูปสรุปสำเร็จ พร้อมดาวน์โหลดหรือแชร์");
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
    setGroupCreated(false);
    setGroupDraft("");
    setEditingPlayerId(null);
    setEditingMatchId(null);
    setMatchDraft([0, 0, 0, 0]);
    setPlayView("courts");
    setGroupName("");
    setName("");
    setMatches([]);
    setHistory([]);
    setRound(0);
    setCourts(1);
    setSlots(Array(4).fill(0));
    setSummary(null);
    setExtras([]);
    setCostFields({ hours: "2", courts: "1", rate: "180", shuttle: "0" });
    setModal(null);
    setStep("group");
    setImageUrl("");
    imageBlob.current = null;
    notify("พร้อมเริ่มก๊วนใหม่");
  };
  const nameFor = (pid: number) =>
    players.find((p) => p.id === pid)?.name || "—";

  const openGroup = () => {
    setGroupDraft(groupName);
    setModal("group");
  };
  const createGroup = (e: FormEvent) => {
    e.preventDefault();
    const value = groupDraft.trim();
    if (!value) {
      notify("กรุณาใส่ชื่อก๊วนก่อน");
      return;
    }
    setGroupName(value);
    setGroupCreated(true);
    setModal(null);
    notify(
      groupCreated ? "เปลี่ยนชื่อก๊วนสำเร็จ" : `สร้างก๊วน ${value} สำเร็จ`,
    );
  };
  const addExpense = (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (
      !expenseName.trim() ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 1000000
    ) {
      notify("ตรวจชื่อรายการและยอดเงินอีกครั้ง");
      return;
    }
    if (extras.length >= 20) {
      notify("เพิ่มได้สูงสุด 20 รายการ");
      return;
    }
    setExtras((items) => [
      ...items,
      { id: Date.now(), name: expenseName.trim(), amount: amount.toFixed(2) },
    ]);
    setExpenseName("");
    setExpenseAmount("");
    setModal(null);
    notify("เพิ่มค่าใช้จ่ายสำเร็จ");
  };

  return {
    step,
    groupCreated,
    groupDraft,
    setGroupDraft,
    groupName,
    players,
    editingPlayerId,
    openNewPlayer,
    openEditPlayer,
    selectedPlayer,
    openPlayerActions,
    removePlayer,
    editingMatchId,
    matchDraft,
    setMatchDraft,
    openEditMatch,
    applyMatchEdit,
    cancelMatch,
    setPlayers,
    name,
    setName,
    level,
    setLevel,
    mode,
    setMode,
    courts,
    setCourts,
    slots,
    setSlots,
    matches,
    round,
    history,
    toast,
    setToast,
    costFields,
    setCostFields,
    extras,
    setExtras,
    summary,
    calculating,
    imageUrl,
    imageBusy,
    modal,
    setModal,
    dialog,
    notify,
    active,
    available,
    totalPlayerGames,
    go,
    addPlayer,
    sample,
    prepare,
    finish,
    undo,
    costInput,
    calculate,
    openImage,
    download,
    share,
    reset,
    nameFor,
    openGroup,
    createGroup,
    expenseName,
    setExpenseName,
    expenseAmount,
    setExpenseAmount,
    addExpense,
    playView,
    setPlayView,
  };
}
