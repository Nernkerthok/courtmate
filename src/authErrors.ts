export function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code === "access_denied")
    return "ยกเลิกการเข้าสู่ระบบแล้ว ก๊วนบนหน้านี้ยังอยู่ กดเข้าสู่ระบบอีกครั้งได้";
  if (["provider_disabled", "provider_email_needs_verification"].includes(code))
    return "Google ยังไม่พร้อมใช้งาน ผู้ดูแลต้องเชื่อมการเข้าสู่ระบบให้เสร็จก่อน";
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(code))
    return "ส่งลิงก์ถี่หรือครบจำนวนที่ระบบอนุญาตแล้ว กรุณารอสักพักก่อนขอใหม่";
  if (code === "email_address_not_authorized")
    return "ระบบยังส่งอีเมลให้ที่อยู่นี้ไม่ได้ ผู้ดูแลต้องตั้งค่าบริการส่งอีเมลก่อน";
  if (code === "email_address_invalid") return "ตรวจรูปแบบอีเมลอีกครั้ง";
  if (
    [
      "bad_code_verifier",
      "flow_state_not_found",
      "flow_state_expired",
      "otp_expired",
    ].includes(code)
  )
    return "ลิงก์นี้ใช้ไม่ได้แล้ว กรุณาขอลิงก์ใหม่และเปิดในเบราว์เซอร์เดียวกับที่กรอกอีเมล";
  return "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองเข้าสู่ระบบใหม่";
}
