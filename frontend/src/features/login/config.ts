/**
 * ค่าตั้งของหน้า Login
 * ------------------------------------------------------------------
 * NEXT_PUBLIC_AUTH_MOCK=true   ใช้ mock auth + แถบ MOCK ด้านล่าง (ค่าเริ่มต้นเมื่อ NODE_ENV !== "production")
 * NEXT_PUBLIC_AUTH_MOCK=false  ใช้ HTTP adapter (เรียก backend จริง ดู auth/http.ts)
 */
const mockEnv = process.env.NEXT_PUBLIC_AUTH_MOCK;
const bypassEnv = process.env.NEXT_PUBLIC_AUTH_BYPASS;

export const LOGIN_CONFIG = {
  /** true = ใช้ข้อมูลจำลอง + แสดงแถบ MOCK */
  mock: mockEnv ? mockEnv === "true" : process.env.NODE_ENV !== "production",
  /** true = ข้ามการตรวจรหัสผ่าน ยอมรับการเข้าสู่ระบบทันที (ปิดเป็นค่าเริ่มต้นใน production) */
  bypass: bypassEnv ? bypassEnv === "true" : process.env.NODE_ENV !== "production",
  appName: "AIVA Portal",
  orgName: "AAPICO AP Hub · ระบบตรวจใบแจ้งหนี้อัตโนมัติ",
  versionLabel: "AIVA Portal v4.20 · SRS v1.1",
  /** ลิงก์ติดต่อ IT Support (production) · ว่าง = ไม่ทำอะไร */
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL ?? "",
  /** เส้นทางหลังเข้าสู่ระบบสำเร็จ (ถ้าไม่มี ?next=) */
  defaultRedirect: "/",
  /** localStorage key ของ “จำชื่อผู้ใช้ในเครื่องนี้” */
  rememberKey: "aiva.login.u",
  /**
   * ล็อกฝั่งหน้าจอ (UX เท่านั้น) · ตัวจริงต้องล็อกที่ backend
   * backend ตอบ { kind: "locked", retryAfterSec } เพื่อบังคับล็อกจริงได้
   */
  maxFail: 5,
  lockSeconds: 30,
} as const;
