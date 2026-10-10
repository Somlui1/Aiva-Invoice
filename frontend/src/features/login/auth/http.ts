import type { AuthAdapter, AuthResult, SessionUser } from "./types";

/**
 * HTTP adapter สำหรับ backend จริง
 * ------------------------------------------------------------------
 * ปรับ endpoint / รูปแบบ response ให้ตรงกับ API ของคุณ
 *
 *  POST /api/auth/ldap        { username, password }
 *     200 { user: SessionUser }            → สำเร็จ (backend ตั้ง HttpOnly session cookie)
 *     401                                  → ชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง
 *     403                                  → ผ่านแล้วแต่ไม่มีสิทธิ์ใช้ Portal
 *     423 { retryAfterSec }                → ถูกล็อก
 *     502 / 504 / network error            → LDAP ไม่ตอบสนอง
 *
 *  Microsoft 365: redirect ไป /api/auth/microsoft/start แล้วให้ backend (หรือ next-auth) ทำ OIDC
 *     กลับมาที่ /login?error=cred|noaccess|timeout เมื่อไม่สำเร็จ · สำเร็จให้ redirect ไป ?next= เอง
 */
const LDAP_URL = "/api/auth/ldap";
const MS_START_URL = "/api/auth/microsoft/start";
const TIMEOUT_MS = 10_000;

async function postJson(url: string, body: unknown, signal?: AbortSignal): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => ctl.abort());
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export function createHttpAuth(): AuthAdapter {
  return {
    async loginLdap(input, call): Promise<AuthResult> {
      let res: Response;
      try {
        res = await postJson(LDAP_URL, input, call?.signal);
      } catch {
        return { ok: false, kind: "timeout" };
      }
      if (res.ok) {
        const data = (await res.json()) as { user: SessionUser };
        return { ok: true, user: data.user };
      }
      if (res.status === 401) return { ok: false, kind: "cred" };
      if (res.status === 403) return { ok: false, kind: "noaccess" };
      if (res.status === 423) {
        const data = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
        return { ok: false, kind: "locked", retryAfterSec: data.retryAfterSec ?? 30 };
      }
      return { ok: false, kind: "timeout" };
    },

    loginMicrosoft(): Promise<AuthResult> {
      const next = new URLSearchParams(window.location.search).get("next") ?? "";
      window.location.assign(`${MS_START_URL}${next ? `?next=${encodeURIComponent(next)}` : ""}`);
      // หน้าถูกเปลี่ยนเส้นทางออกไป · promise นี้ไม่ resolve
      return new Promise<AuthResult>(() => {});
    },

    reportFailure() {
      /* backend บันทึก Audit ของความพยายามที่ไม่สำเร็จอยู่แล้ว · ไม่ต้องทำซ้ำที่ client */
    },
  };
}
