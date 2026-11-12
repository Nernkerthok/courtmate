import { useState } from "react";
import {
  Copy,
  Link,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import type { useCloudGroups } from "./useCloudGroups";
import { lineInvitation } from "./invites";

export function InvitePanel({
  cloud,
  groupName,
  onAccount,
}: {
  cloud: ReturnType<typeof useCloudGroups>;
  groupName: string;
  onAccount: () => void;
}) {
  const [message, setMessage] = useState("");
  const share = cloud.invite
    ? lineInvitation(groupName, cloud.invite.url)
    : null;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("คัดลอกแล้ว พร้อมวางในแชต LINE");
    } catch {
      setMessage("คัดลอกไม่สำเร็จ แตะค้างที่ลิงก์เพื่อคัดลอกได้");
    }
  };
  return (
    <div className="account-panel">
      <div className="account-intro">
        <MessageCircle size={25} aria-hidden="true" />
        <div>
          <h3>ชวนเพื่อนมา {groupName}</h3>
          <p>
            เพื่อนดูชื่อก๊วน รายชื่อ Level และไอคอนได้ ผู้จัดก๊วนเป็นคนแก้ไข
          </p>
        </div>
      </div>
      <p className="account-help">
        ผู้ที่มีลิงก์สามารถเปิดดูรายชื่อได้ ลิงก์มีอายุ 7 วัน
        และคุณปิดลิงก์ได้ตลอด ค่าใช้จ่ายและประวัติเกมจะไม่แสดงในลิงก์นี้
      </p>
      {!cloud.ready || !cloud.user ? (
        <>
          <p className="account-help">
            เข้าสู่ระบบและบันทึกก๊วนก่อน เพื่อสร้างลิงก์ชวนเพื่อน
          </p>
          <button className="btn btn-primary w-full" onClick={onAccount}>
            ไปหน้าบัญชี
          </button>
        </>
      ) : (
        <>
          <p className="account-help">
            เมื่อสร้างลิงก์เชิญใหม่ ลิงก์เดิมของก๊วนนี้จะเปิดไม่ได้
          </p>
          <button
            className="btn btn-primary w-full"
            disabled={Boolean(cloud.busy)}
            onClick={() => void cloud.createInvitation()}
          >
            {cloud.busy ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Link size={17} />
            )}{" "}
            {cloud.busy
              ? "กำลังดำเนินการ…"
              : cloud.dirty
                ? "บันทึกและสร้างลิงก์เชิญ"
                : cloud.invite
                  ? "สร้างลิงก์เชิญใหม่"
                  : "สร้างลิงก์เชิญ"}
          </button>
          {cloud.invite && share && (
            <>
              <p className="account-help">
                หมดอายุ{" "}
                {new Date(cloud.invite.expiresAt).toLocaleString("th-TH", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · สร้างลิงก์ใหม่จะปิดลิงก์เดิม
              </p>
              {cloud.dirty ? (
                <p className="account-error">
                  มีการแก้ไขที่ยังไม่บันทึก กดปุ่มด้านบนก่อนชวนเพื่อน
                </p>
              ) : (
                <a
                  className="btn line-share-button w-full"
                  href={share.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  ชวนผ่าน LINE
                </a>
              )}
              <label className="caption" htmlFor="invite-link">
                ลิงก์สำหรับดูรายชื่อ
              </label>
              <input
                id="invite-link"
                readOnly
                className="field invite-link-field"
                value={cloud.invite.url}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="btn btn-secondary"
                  disabled={Boolean(cloud.busy) || cloud.dirty}
                  onClick={() => void copy(cloud.invite!.url)}
                >
                  <Copy size={15} />
                  คัดลอกลิงก์
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={Boolean(cloud.busy) || cloud.dirty}
                  onClick={() => void copy(share.message)}
                >
                  คัดลอกข้อความ
                </button>
              </div>
            </>
          )}
          {cloud.attached && (
            <button
              className="btn btn-secondary w-full"
              disabled={Boolean(cloud.busy)}
              onClick={() => void cloud.revokeInvitation()}
            >
              ปิดลิงก์เชิญของก๊วนนี้
            </button>
          )}
        </>
      )}
      {message && (
        <p role="status" className="account-success">
          {message}
        </p>
      )}
      <p className="account-privacy">
        <ShieldCheck size={15} aria-hidden="true" />
        คุณเลือกแชตและกดส่งใน LINE เอง บนคอมพิวเตอร์ใช้ปุ่มคัดลอกแล้ววางในแชตได้
      </p>
    </div>
  );
}
