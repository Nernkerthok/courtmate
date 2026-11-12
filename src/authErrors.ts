export function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
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
  return "เชื่อมต่อระบบเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจอีเมลและอินเทอร์เน็ตแล้วลองใหม่";
}
