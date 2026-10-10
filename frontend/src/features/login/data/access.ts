import { MAPS, ROLES, type DemoDoc, type DemoUser } from "./demo";

/** Oracle account (RECEIVER) ที่ผูกกับผู้ใช้ */
export const acctsOf = (u: DemoUser) => MAPS.filter((m) => m.user === u.id).map((m) => m.acct);

export interface ScopeResult {
  ok: boolean;
  why?: string;
}

/**
 * กฎการมองเห็นเอกสาร (RBAC) · ตรงกับ scopeCheck ใน mockup
 * ใช้เฉพาะแท็บ “สิทธิ์และบทบาท” เพื่อสาธิต · การบังคับสิทธิ์จริงต้องทำที่ backend
 */
export function scopeCheck(d: DemoDoc, u: DemoUser): ScopeResult {
  const r = ROLES[u.role];
  if (r.scope === "none") return { ok: false, why: "บทบาทนี้ไม่เข้าถึงเนื้อหาเอกสาร" };
  if (!u.co.includes(d.company)) return { ok: false, why: `เอกสารอยู่นอกบริษัทที่ได้รับมอบหมาย (${d.company})` };
  if (r.scope === "receiver" && !d.receiver) return { ok: false, why: "เอกสารยังไม่มี Receiver ในใบรับ · ฝ่ายบัญชีดำเนินการ" };
  if (r.scope === "receiver" && d.receiver && !acctsOf(u).includes(d.receiver))
    return { ok: false, why: `ไม่ได้เป็น Receiver ของใบรับนี้ (Receiver = ${d.receiver})` };
  return { ok: true };
}

/** ข้อความสั้นสำหรับแสดงในแถวที่ถูกซ่อน */
export function whyShort(w?: string): string {
  if (!w) return "";
  if (/นอกบริษัท/.test(w)) return "นอกบริษัทที่รับผิดชอบ";
  if (/ยังไม่มี Receiver/.test(w)) return "ไม่มี Receiver";
  if (/ไม่ได้เป็น Receiver/.test(w)) return "ไม่ใช่ Receiver ของคุณ";
  if (/ไม่เข้าถึง/.test(w)) return "ไม่เห็นเนื้อหาเอกสาร";
  return w;
}

export const fmtBaht = (n: number) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
