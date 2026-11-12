import { useEffect, useState, type FormEvent } from "react";
import {
  Cloud,
  CloudUpload,
  FolderOpen,
  LoaderCircle,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { useCloudGroups } from "./useCloudGroups";
import googleMark from "./assets/google-g.png";

type Props = {
  cloud: ReturnType<typeof useCloudGroups>;
  groupName: string | null;
  onInstall: () => void;
  onInvite: () => void;
};
export function AccountPanel({ cloud, groupName, onInstall, onInvite }: Props) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (now >= cloud.resendAt) return;
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [now, cloud.resendAt]);
  const seconds = Math.max(0, Math.ceil((cloud.resendAt - now) / 1000));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void cloud.sendLink(email);
  };
  const open = (id: string) => {
    setConfirmLogout(false);
    if (groupName && cloud.dirty) setPending(id);
    else void cloud.open(id);
  };
  return (
    <div className="account-panel">
      <div className="account-intro">
        <Cloud size={25} aria-hidden="true" />
        <div>
          <h3>ก๊วนของคุณ ไปต่อได้ทุกเครื่อง</h3>
          <p>บันทึกรายชื่อ ไอคอน เกม และค่าใช้จ่ายไว้ด้วยกัน</p>
        </div>
      </div>
      {!cloud.ready ? (
        <p className="account-help">
          การบันทึกออนไลน์ยังไม่พร้อมใช้งาน
          คุณยังจัดก๊วนและคำนวณบนหน้านี้ได้ตามปกติ
        </p>
      ) : cloud.authLoading ? (
        <p role="status" className="account-help">
          กำลังตรวจการเข้าสู่ระบบ…
        </p>
      ) : !cloud.user ? (
        <section aria-label="เข้าสู่ระบบผู้จัดก๊วน">
          <button
            type="button"
            className="google-signin"
            disabled={Boolean(cloud.busy) || cloud.googleStatus !== "enabled"}
            onClick={() => void cloud.signInGoogle()}
            aria-describedby="google-signin-help"
          >
            {cloud.busy === "google" || cloud.googleStatus === "checking" ? (
              <LoaderCircle
                className="animate-spin"
                size={20}
                aria-hidden="true"
              />
            ) : (
              <img src={googleMark} alt="" width={20} height={20} />
            )}
            {cloud.busy === "google"
              ? "กำลังไปที่ Google…"
              : "เข้าสู่ระบบด้วย Google"}
          </button>
          <p id="google-signin-help" className="account-help" role="status">
            {cloud.googleStatus === "checking"
              ? "กำลังตรวจความพร้อม…"
              : cloud.googleStatus === "disabled"
                ? "Google ยังอยู่ระหว่างตั้งค่า ลองใหม่เมื่อผู้ดูแลเชื่อมต่อเสร็จแล้ว"
                : cloud.googleStatus === "error"
                  ? "ตรวจความพร้อมไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่"
                  : "เลือกบัญชี Google แล้วกลับมาจัดก๊วนต่อได้เลย ไม่ต้องรออีเมล"}
          </p>
          {["disabled", "error"].includes(cloud.googleStatus) && (
            <button
              type="button"
              className="btn btn-secondary mt-3 w-full"
              disabled={Boolean(cloud.busy)}
              onClick={() => void cloud.checkGoogle()}
            >
              <RefreshCw size={16} aria-hidden="true" /> ตรวจความพร้อมอีกครั้ง
            </button>
          )}
          {groupName && (
            <p className="account-help">
              เมื่อกดเข้าสู่ระบบ
              จะเก็บก๊วนนี้ชั่วคราวในแท็บเดิมเพื่อกลับมาต่อภายใน 30 นาที
              กลับมาแล้วกดบันทึกเพื่อเก็บออนไลน์
            </p>
          )}
          {cloud.authError && (
            <div className="account-error" role="alert">
              {cloud.authError}
            </div>
          )}
          <details className="email-alternative">
            <summary>เข้าสู่ระบบทางอีเมล</summary>
            <p className="account-help">
              สำหรับอีเมลที่ผู้ดูแลเปิดให้ใช้งานแล้ว
            </p>
            <form onSubmit={submit}>
              <label className="caption" htmlFor="account-email">
                อีเมลผู้จัดก๊วน
              </label>
              <input
                id="account-email"
                className="field"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={254}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={Boolean(cloud.busy)}
              />
              <button
                className="btn btn-primary mt-4 w-full"
                disabled={Boolean(cloud.busy) || seconds > 0}
              >
                {cloud.busy === "email" ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={18}
                    aria-hidden="true"
                  />
                ) : (
                  <Mail size={18} aria-hidden="true" />
                )}
                {cloud.busy === "email"
                  ? "กำลังส่งลิงก์…"
                  : seconds > 0
                    ? `ส่งใหม่ได้ใน ${seconds} วินาที`
                    : cloud.emailSent
                      ? "ส่งลิงก์อีกครั้ง"
                      : "รับลิงก์เข้าสู่ระบบ"}
              </button>
              {cloud.emailSent && !cloud.authError && (
                <div className="account-success" role="status">
                  ส่งลิงก์แล้ว ตรวจอีเมลและสแปม
                  แล้วเปิดลิงก์ในเบราว์เซอร์ที่ใช้ขอเข้าสู่ระบบนี้
                  <p className="mt-2">
                    หากใช้ Gmail ลองค้นหา <code>in:anywhere supabase</code>
                  </p>
                </div>
              )}
              <p className="account-help">
                ไม่ต้องตั้งรหัสผ่าน · เมื่อเข้าสู่ระบบ
                อุปกรณ์นี้จะจำบัญชีไว้จนกดออกจากระบบ
              </p>
            </form>
          </details>
          <p className="account-help">
            หากเปิดจากแชต LINE ให้เลือกเปิดใน Chrome หรือ Safari ก่อนเข้าสู่ระบบ
          </p>
        </section>
      ) : (
        <>
          <div className="account-user">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>{cloud.user.email}</span>
          </div>
          {groupName && (
            <section className="cloud-current" aria-label="ก๊วนที่กำลังใช้งาน">
              <span className="caption">ก๊วนที่กำลังใช้งาน</span>
              <h3>{groupName}</h3>
              <p>
                {cloud.attached
                  ? cloud.dirty
                    ? "มีการแก้ไขที่ยังไม่ได้บันทึก"
                    : "บันทึกออนไลน์แล้ว"
                  : "ยังไม่ได้บันทึกออนไลน์"}
              </p>
              <button
                className="btn btn-primary mt-3 w-full"
                disabled={Boolean(cloud.busy) || !cloud.dirty}
                onClick={() => void cloud.save()}
              >
                {cloud.busy === "save" ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={17}
                    aria-hidden="true"
                  />
                ) : (
                  <CloudUpload size={17} aria-hidden="true" />
                )}
                {cloud.busy === "save"
                  ? "กำลังบันทึก…"
                  : cloud.attached
                    ? "บันทึกการแก้ไข"
                    : "บันทึกก๊วนนี้"}
              </button>
              <button
                className="btn btn-secondary mt-3 w-full"
                disabled={Boolean(cloud.busy)}
                onClick={onInvite}
              >
                ชวนเพื่อนผ่าน LINE
              </button>
            </section>
          )}
          <section aria-label="ก๊วนที่บันทึกไว้">
            <div className="cloud-list-heading">
              <h3>ก๊วนที่บันทึกไว้</h3>
              <button
                className="icon-btn"
                aria-label="โหลดรายการก๊วนใหม่"
                disabled={cloud.listLoading || Boolean(cloud.busy)}
                onClick={() => void cloud.refresh()}
              >
                <RefreshCw
                  size={17}
                  className={cloud.listLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
            {cloud.listError && (
              <p className="account-error" role="alert">
                {cloud.listError}
              </p>
            )}
            {cloud.listLoading && !cloud.groups.length ? (
              <p role="status" className="account-help">
                กำลังโหลดก๊วน…
              </p>
            ) : !cloud.listError && !cloud.groups.length ? (
              <p className="account-help">
                ยังไม่มีก๊วนที่บันทึก สร้างก๊วนแล้วกด “บันทึกก๊วนนี้” ได้เลย
              </p>
            ) : null}
            <div className="saved-groups">
              {cloud.groups.map((group) => (
                <button
                  key={group.id}
                  className="saved-group"
                  disabled={Boolean(cloud.busy)}
                  aria-label={`เปิดก๊วน ${group.name}`}
                  onClick={() => open(group.id)}
                >
                  <FolderOpen size={20} aria-hidden="true" />
                  <span>
                    <strong>{group.name}</strong>
                    <small>
                      {group.player_count} คน · เล่นจบ {group.completed_games}{" "}
                      เกม
                    </small>
                    <small>
                      {new Date(group.updated_at).toLocaleString("th-TH", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {cloud.attached?.id === group.id ? " · กำลังใช้งาน" : ""}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            {cloud.hasMore && (
              <button
                className="btn btn-secondary mt-3 w-full"
                disabled={cloud.listLoading || Boolean(cloud.busy)}
                onClick={() => void cloud.refresh(true)}
              >
                {cloud.listLoading ? "กำลังโหลด…" : "ดูก๊วนเพิ่มเติม"}
              </button>
            )}
          </section>
          {pending && (
            <section className="cloud-confirm" role="alert">
              <p>
                ข้อมูลบนหน้านี้ยังไม่ได้บันทึก
                ต้องการเปิดก๊วนที่เลือกแทนหรือไม่?
              </p>
              <div>
                <button
                  className="btn btn-secondary"
                  disabled={Boolean(cloud.busy)}
                  onClick={() => setPending(null)}
                >
                  กลับไปบันทึก
                </button>
                <button
                  className="btn btn-primary"
                  disabled={Boolean(cloud.busy)}
                  onClick={() => void cloud.open(pending)}
                >
                  เปิดก๊วนที่เลือก
                </button>
              </div>
            </section>
          )}
          {confirmLogout ? (
            <section className="cloud-confirm" role="alert">
              <p>
                {cloud.dirty
                  ? "ยังมีข้อมูลที่ไม่ได้บันทึก หากออกจากระบบ ข้อมูลบนหน้านี้จะถูกล้าง"
                  : "ออกจากระบบบนเครื่องนี้? ก๊วนที่บันทึกออนไลน์ยังอยู่"}
              </p>
              <div>
                <button
                  className="btn btn-secondary"
                  disabled={Boolean(cloud.busy)}
                  onClick={() => setConfirmLogout(false)}
                >
                  กลับ
                </button>
                <button
                  className="btn btn-primary"
                  disabled={Boolean(cloud.busy)}
                  onClick={() => void cloud.logout()}
                >
                  ยืนยันออกจากระบบ
                </button>
              </div>
            </section>
          ) : (
            <button
              className="btn btn-secondary w-full"
              disabled={Boolean(cloud.busy)}
              onClick={() => {
                setPending(null);
                setConfirmLogout(true);
              }}
            >
              <LogOut size={17} aria-hidden="true" />
              ออกจากระบบบนเครื่องนี้
            </button>
          )}
        </>
      )}
      <p className="account-privacy">
        <ShieldCheck size={15} aria-hidden="true" />
        ก๊วนที่บันทึกเปิดได้เฉพาะบัญชีของคุณ · กดบันทึกก่อนปิดหน้า
      </p>
      <button className="btn btn-secondary w-full" onClick={onInstall}>
        <Smartphone size={17} aria-hidden="true" />
        ติดตั้งแอปบนเครื่อง
      </button>
    </div>
  );
}
