/**
 * ค่าตั้งของหน้า Login
 * ------------------------------------------------------------------
 * NEXT_PUBLIC_AUTH_MOCK=true   ใช้ mock auth + แถบ MOCK ด้านล่าง (ค่าเริ่มต้นเมื่อ NODE_ENV !== "production")
 * NEXT_PUBLIC_AUTH_MOCK=false  ใช้ HTTP adapter (เรียก backend จริง ดู auth/http.ts)
 */
/*
 * v5.5: อ่านจาก import.meta.env ของ Vite (ฝังตอน build) แทน process.env
 * เดิม vite.config.ts กำหนด process.env = {} ในเบราว์เซอร์ → NODE_ENV เป็น undefined เสมอ
 * → mock และ bypass เป็น true แม้ใน build production (หน้า login ไม่ตรวจรหัสผ่านจริง)
 *
 *  VITE_AUTH_MOCK=true    ใช้ mock auth + แถบ MOCK (ค่าเริ่มต้น: เฉพาะ `vite` dev server)
 *  VITE_AUTH_BYPASS=true  mock ยอมรับทุกรหัสผ่าน (ค่าเริ่มต้น: เท่ากับ mock)
 *  build production (`vite build`) = ปิดทั้งคู่เสมอ ไม่ว่าตั้งค่าอะไร
 */
type EnvBag = Record<string, string | boolean | undefined>;
const viteEnv: EnvBag = ((import.meta as unknown as { env?: EnvBag }).env ?? {}) as EnvBag;

export function resolveLoginFlags(e: EnvBag): { mock: boolean; bypass: boolean } {
  const prod = e.PROD === true || e.MODE === "production";
  if (prod) return { mock: false, bypass: false };
  const dev = e.DEV === true || e.MODE === "development";
  const mockRaw = e.VITE_AUTH_MOCK;
  const mock = mockRaw !== undefined && mockRaw !== "" ? String(mockRaw) === "true" : dev;
  const bypassRaw = e.VITE_AUTH_BYPASS;
  const bypass = mock && (bypassRaw !== undefined && bypassRaw !== "" ? String(bypassRaw) === "true" : dev);
  return { mock, bypass };
}
const flags = resolveLoginFlags(viteEnv);
const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;

export const LOGIN_CONFIG = {
  /** true = ใช้ข้อมูลจำลอง + แสดงแถบ MOCK */
  mock: flags.mock,
  /** true = ข้ามการตรวจรหัสผ่าน ยอมรับการเข้าสู่ระบบทันที (ปิดเสมอใน build production) */
  bypass: flags.bypass,
  appName: "AIVA Portal",
  orgName: "AAPICO AP Hub · ระบบตรวจใบแจ้งหนี้อัตโนมัติ",
  versionLabel: "AIVA Portal v5.2 · React 19 SPA",
  /** ลิงก์ติดต่อ IT Support (production) · ว่าง = ไม่ทำอะไร */
  supportUrl: env.NEXT_PUBLIC_SUPPORT_URL ?? "",
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
