import { useState, type FormEvent } from "react";
import { Users } from "lucide-react";
import { levelNames, MAX_PLAYERS, type Player } from "./domain";
import { reviewBulkNames } from "./bulkPlayers";

export function BulkPlayersForm({
  players,
  onAdd,
  onDone,
}: {
  players: Player[];
  onAdd: (raw: string, level: number) => boolean;
  onDone: () => void;
}) {
  const [raw, setRaw] = useState("");
  const [level, setLevel] = useState(3);
  const { names, errors } = reviewBulkNames(players, raw);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!errors.length && onAdd(raw, level)) setRaw("");
  };
  return (
    <form onSubmit={submit}>
      <label className="caption" htmlFor="bulk-player-names">
        รายชื่อเพื่อน
      </label>
      <textarea
        id="bulk-player-names"
        className="field bulk-player-names"
        autoFocus
        required
        rows={4}
        maxLength={5000}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"ต้น\nมิน\nเจมส์\nพลอย"}
        disabled={players.length >= MAX_PLAYERS}
        aria-describedby="bulk-player-help bulk-player-status"
        aria-invalid={Boolean(raw.trim() && errors.length)}
      />
      <p id="bulk-player-help" className="mt-2 text-xs leading-6 text-muted">
        พิมพ์หรือวางชื่อคนละบรรทัด หรือคั่นด้วยคอมมา เช่น ต้น, มิน, พลอย
      </p>
      <label className="caption mt-4" htmlFor="bulk-player-level">
        Level เริ่มต้นของทุกคนในชุดนี้
      </label>
      <select
        id="bulk-player-level"
        className="field"
        value={level}
        onChange={(e) => setLevel(Number(e.target.value))}
      >
        {levelNames.slice(1).map((name, i) => (
          <option key={name} value={i + 1}>
            Level {i + 1} · {name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-6 text-muted">
        ระบบเลือกไอคอนเริ่มต้นให้แต่ละคน แตะการ์ดผู้เล่นเพื่อแก้ชื่อ Level
        หรือไอคอนภายหลังได้
      </p>
      <div
        id="bulk-player-status"
        className="bulk-player-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {raw.trim() && errors.length ? (
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <p>
            {names.length
              ? `พร้อมเพิ่ม ${names.length} คน · รวมเป็น ${players.length + names.length} คน`
              : `มี ${players.length} คนในก๊วน · เพิ่มได้อีก ${Math.max(0, MAX_PLAYERS - players.length)} คน`}
          </p>
        )}
      </div>
      <div className="player-form-actions mt-4 grid grid-cols-[1fr_1.7fr] gap-3">
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          เสร็จแล้ว
        </button>
        <button className="btn btn-primary" disabled={Boolean(errors.length)}>
          <Users size={16} aria-hidden="true" />
          {names.length ? `เพิ่ม ${names.length} คน` : "เพิ่มผู้เล่น"}
        </button>
      </div>
    </form>
  );
}
