import type { Role } from "../data/demo";

export type LoginMethod = "m365" | "ldap";

/** ผู้ใช้ที่ backend ยืนยันแล้ว (เท่าที่หน้า login ต้องใช้แสดงผล) */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** บริษัทที่รับผิดชอบ เช่น ["AH","AHT"] */
  companies: string[];
  /** Oracle account (RECEIVER) ที่ผูกไว้ · ใช้กับ End User */
  oracleAccounts: string[];
}

export type AuthFailKind =
  /** ชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง หรือยกเลิก/ยืนยันกับ Microsoft ไม่ผ่าน */
  | "cred"
  /** ยืนยันตัวตนผ่านแล้ว แต่ไม่มีบทบาทใน Portal (ยังไม่ถูกเพิ่มในกลุ่มสิทธิ์) */
  | "noaccess"
  /** ระบบยืนยันตัวตน (LDAP / Microsoft) ไม่ตอบสนอง */
  | "timeout"
  /** backend ล็อกบัญชีแล้ว */
  | "locked";

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; kind: Exclude<AuthFailKind, "locked"> }
  | { ok: false; kind: "locked"; retryAfterSec: number };

export interface AuthCall {
  signal?: AbortSignal;
}

/**
 * สัญญาระหว่างหน้า Login กับระบบยืนยันตัวตนจริง
 * - browser ไม่คุย LDAP ตรง: ฟอร์ม POST ไป backend แล้ว backend bind LDAP (NFR-014 ห้ามมี credential ใน client)
 * - Microsoft 365 = OAuth 2.0 / OIDC (Authorization Code + PKCE) ทำที่ backend / next-auth
 */
export interface AuthAdapter {
  loginLdap(input: { username: string; password: string }, call?: AuthCall): Promise<AuthResult>;
  /** อาจ redirect ออกจากหน้า (promise ไม่ resolve) หรือ resolve เมื่อใช้ popup flow */
  loginMicrosoft(call?: AuthCall): Promise<AuthResult>;
  /** บันทึกความพยายามที่ไม่สำเร็จลง Audit (ไม่บังคับ) */
  reportFailure?(e: { method: LoginMethod; identity: string; kind: AuthFailKind; detail: string }): void;
}
