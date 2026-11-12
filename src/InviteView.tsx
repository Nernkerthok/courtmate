import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Users } from "lucide-react";
import { supabase } from "./supabase";
import {
  parseInviteHash,
  parsePublicRoster,
  type PublicRoster,
} from "./invites";
import { levelNames } from "./domain";
import { Avatar } from "./Avatar";

export function InviteView({ hash }: { hash: string }) {
  const [roster, setRoster] = useState<PublicRoster | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const key = parseInviteHash(hash);
    setLoading(true);
    setError("");
    setRoster(null);
    if (!key || !supabase) {
      setError("ลิงก์นี้ไม่พร้อมใช้งาน อาจหมดอายุหรือถูกปิดแล้ว");
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => controller.abort(), 15000);
    (async () => {
      try {
        const { data, error } = await supabase
          .rpc("courtmate_read_invite", {
            p_group_id: key.groupId,
            p_token: key.token,
          })
          .abortSignal(controller.signal);
        if (error) throw error;
        const value = parsePublicRoster(data);
        if (live) setRoster(value);
      } catch {
        if (live)
          setError(
            "เปิดลิงก์ไม่ได้ อาจหมดอายุ ถูกปิด หรืออินเทอร์เน็ตไม่พร้อม กรุณาลองใหม่หรือติดต่อผู้จัดก๊วน",
          );
      } finally {
        clearTimeout(timer);
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [hash, refresh]);
  return (
    <div className="app-frame invite-view">
      <header className="app-header">
        <div className="invite-header">
          <img src="./icon.svg" alt="" width="38" height="38" />
          <span className="brand-name">
            CourtMate<small className="brand-tagline">ชวนเพื่อนมาตีแบด</small>
          </span>
        </div>
      </header>
      <main className="invite-content">
        <img
          className="scene-strip"
          src="./art/badminton-duo.webp"
          alt=""
          width="960"
          height="640"
        />
        <div className="invite-title">
          <div>
            <span className="eyebrow">ชวนมาตีแบดด้วยกัน</span>
            <h1>{roster?.groupName || "คำเชิญเข้าก๊วน"}</h1>
          </div>
          <Users size={26} aria-hidden="true" />
        </div>
        <p className="account-privacy">
          <ShieldCheck size={15} aria-hidden="true" />
          หน้านี้สำหรับดูรายชื่อ สนใจร่วมเล่น ทักผู้จัดก๊วนในแชต LINE ได้เลย
        </p>
        {loading ? (
          <p role="status" className="account-help">
            กำลังโหลดรายชื่อ…
          </p>
        ) : error ? (
          <div className="account-error" role="alert">
            {error}
          </div>
        ) : (
          roster && (
            <>
              <h2 className="text-sm font-medium">
                เพื่อนร่วมก๊วน {roster.players.length} คน
              </h2>
              <div className="invite-roster">
                {roster.players.map((p) => (
                  <article className="invite-person" key={p.id}>
                    <Avatar p={p} />
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        L{p.level} · {levelNames[p.level]}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
              {!roster.players.length && (
                <p className="account-help">ผู้จัดก๊วนกำลังเพิ่มรายชื่อ</p>
              )}
              <p className="account-help">
                ข้อมูลที่บันทึกล่าสุด{" "}
                {new Date(roster.updated_at).toLocaleString("th-TH", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          )
        )}
        <button
          className="btn btn-secondary w-full"
          disabled={loading}
          onClick={() => setRefresh((n) => n + 1)}
        >
          <RefreshCw size={17} aria-hidden="true" />
          โหลดรายชื่อใหม่
        </button>
        <a
          className="btn btn-primary w-full"
          href={`${location.origin}${location.pathname}`}
        >
          เปิด CourtMate เพื่อจัดก๊วนของฉัน
        </a>
      </main>
    </div>
  );
}
