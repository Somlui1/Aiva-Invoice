import { LOGIN_CONFIG } from "../config";
import { MAPS, USERS, type DemoUser } from "../data/demo";
import type { AuthAdapter, AuthResult, SessionUser } from "./types";

/** ผลจำลองที่เลือกจากแถบ MOCK */
export type MockSim = "auto" | "cred" | "noaccess" | "timeout";

export interface MockControls {
  sim: MockSim;
  /** id ของบัญชี Microsoft ทดสอบ (USERS) */
  acct: string;
}

/** รหัสผ่านทดสอบ · ใช้เฉพาะ mock (NFR-014 ห้ามมี credential ในโค้ด client ของจริง) */
export const MOCK_PASSWORD = "1234";

const sleep = (ms: number) =>
  new Promise<void>((r) => {
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(r, reduce ? Math.min(ms, 120) : ms);
  });

const norm = (s: string) => s.trim().toLowerCase();

export const toSessionUser = (u: DemoUser): SessionUser => ({
  id: u.id,
  name: u.n,
  email: u.email,
  role: u.role,
  companies: u.co,
  oracleAccounts: MAPS.filter((m) => m.user === u.id).map((m) => m.acct),
});

/** ชื่อผู้ใช้ LDAP = ส่วนหน้าอีเมล (somsak.j) หรืออีเมลเต็ม */
const findUser = (s: string) => {
  const k = norm(s);
  if (!k) return null;
  return USERS.find((u) => u.email === k || u.email.split("@")[0] === k) ?? null;
};

/**
 * v5.5: the API trusts only a signed session cookie. In development the mock login asks the server
 * for one (POST /api/auth/dev-login — available only when the server runs with AUTH_DEV_LOGIN=true,
 * never in production). Best effort: no server (UI-only work) or a test without fetch = nothing happens.
 */
async function devLogin(user: SessionUser): Promise<void> {
  if (typeof fetch !== "function" || typeof window === "undefined" || !/^https?:/.test(window.location?.protocol ?? "")) return;
  try {
    await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ user }),
    });
  } catch {
    /* no server: the UI still works on mock data */
  }
}

/**
 * Mock adapter · จำลอง 4 ขั้นของการยืนยันตัวตนตามจังหวะเดิมใน mockup
 * getControls() ถูกเรียกทุกครั้งที่กดเข้าสู่ระบบ เพื่ออ่านค่าล่าสุดจากแถบ MOCK
 */
export function createMockAuth(getControls: () => MockControls): AuthAdapter {
  const STEPS = 4;

  async function run(method: "m365" | "ldap", resolve: () => DemoUser | null, strictCred: boolean): Promise<AuthResult> {
    const { sim } = getControls();
    const failAt = sim === "timeout" ? 0 : sim === "cred" ? 1 : sim === "noaccess" ? 2 : null;
    const user = resolve();
    // ผลจำลองตามข้อมูลที่กรอก
    const natural: number | null = strictCred && !user ? 1 : !strictCred && !user ? 2 : null;
    const stop = failAt ?? natural;
    for (let i = 0; i < STEPS; i++) {
      await sleep(i === 0 && method === "m365" ? 750 : 540);
      if (stop === i) {
        if (i === 0) return { ok: false, kind: "timeout" };
        if (i === 1) return { ok: false, kind: "cred" };
        return { ok: false, kind: "noaccess" };
      }
    }
    if (!user) return { ok: false, kind: "noaccess" };
    const session = toSessionUser(user);
    await devLogin(session);
    return { ok: true, user: session };
  }

  return {
    loginLdap({ username, password }) {
      const u = findUser(username) ?? (LOGIN_CONFIG.bypass ? USERS[0] : null);
      const credOk = LOGIN_CONFIG.bypass ? true : !!u && password === MOCK_PASSWORD;
      return run("ldap", () => (credOk ? u : null), !LOGIN_CONFIG.bypass);
    },
    loginMicrosoft() {
      const { acct } = getControls();
      return run("m365", () => USERS.find((u) => u.id === acct) ?? USERS[0], false);
    },
    reportFailure() {
      /* mock: ไม่ทำอะไร (ของจริงให้ backend บันทึก Audit) */
    },
  };
}
