"use client";

import { useRouter } from "../../lib/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loginIn, loginOut, markJustLoggedIn } from "../../lib/fx";
import { createHttpAuth } from "./auth/http";
import { createMockAuth, toSessionUser, type MockControls } from "./auth/mock";
import type { AuthAdapter, AuthFailKind, LoginMethod, SessionUser } from "./auth/types";
import { LOGIN_CONFIG } from "./config";
import { USERS } from "./data/demo";
import { HowItWorks } from "./explainer/HowItWorks";
import { LoginForm } from "./LoginForm";
import { MockBar } from "./MockBar";
import { ProgressBar } from "./ProgressBar";
import { Toasts, useToasts } from "./Toasts";
import { safeRedirect } from "./utils";
import { useLogin } from "./useLogin";
import { SESSION_EXPIRED_MESSAGE, consumeExpiredNotice, verifySession } from "../../lib/session";

/** พารามิเตอร์ที่ /login รับจากการ redirect: ?expired=1 · ?error=cred|noaccess|timeout · ?sso=1 · ?next=/path */
function readLoginQuery() {
  if (typeof window === "undefined") return { expired: false, error: null as AuthFailKind | null, sso: false, next: undefined as string | undefined };
  const q = new URLSearchParams(window.location.search);
  const e = q.get("error");
  const error: AuthFailKind | null = e === "cred" || e === "noaccess" || e === "timeout" ? e : e ? "cred" : null;
  return { expired: consumeExpiredNotice(window.location.search), error, sso: q.get("sso") === "1", next: q.get("next") ?? undefined };
}

/** GET /api/auth/providers → วิธีเข้าสู่ระบบที่ server เปิดไว้ (Microsoft 365 ต้องตั้งค่า Entra ID ก่อน) */
interface Providers {
  ldap: boolean;
  m365: boolean;
}
import "./login.css";

export interface LoginPageProps {
  /** ปลายทางหลังเข้าสู่ระบบสำเร็จ (ต้องเป็น path ภายในระบบ เช่น /queue) */
  redirectTo?: string;
  /** ข้อผิดพลาดจากการ redirect กลับมา เช่น ?error=noaccess */
  initialError?: AuthFailKind | null;
  /** ระบุ adapter เอง (ไม่ระบุ = mock ตอน dev / HTTP ตอน production) */
  adapter?: AuthAdapter;
  /** บังคับโหมด mock เปิด/ปิด (ไม่ระบุ = ตาม LOGIN_CONFIG.mock) */
  mock?: boolean;
  /** แสดงแผง “ระบบทำงานอย่างไร” ฝั่งขวา (ค่าเริ่มต้น true · หน้าจอ < 1100px ซ่อนอัตโนมัติ) */
  showExplainer?: boolean;
  /** ทำอย่างอื่นแทนการ redirect หลังสำเร็จ */
  onSuccess?: (user: SessionUser, method: LoginMethod) => void;
}

export function LoginPage({ redirectTo: redirectProp, initialError: initialErrorProp = null, adapter, mock, showExplainer = true, onSuccess }: LoginPageProps) {
  const router = useRouter();
  const [query] = useState(readLoginQuery);
  const redirectTo = redirectProp ?? query.next;
  const initialError = initialErrorProp ?? query.error;
  const initialNotice = useMemo(
    () => (query.expired ? { kind: "warn" as const, title: SESSION_EXPIRED_MESSAGE, message: "ระบบได้ออกจากระบบให้อัตโนมัติเพื่อความปลอดภัย · ข้อมูลที่บันทึกแล้วไม่สูญหาย" } : null),
    [query.expired],
  );
  const [providers, setProviders] = useState<Providers | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // เปิดหน้า login แบบมีแอนิเมชัน (ถ้า splash กำลังแสดงอยู่ splash จะเรียกเองตอนจบ)
  useEffect(() => {
    if (!document.getElementById("splash")) loginIn();
  }, []);
  const isMock = mock ?? LOGIN_CONFIG.mock;
  const toasts = useToasts();

  const [mockCtl, setMockCtl] = useState<MockControls>({ sim: "auto", acct: "wajeepradit.p" });
  const mockRef = useRef(mockCtl);
  mockRef.current = mockCtl;

  const auth = useMemo<AuthAdapter>(
    () => adapter ?? (isMock ? createMockAuth(() => mockRef.current) : createHttpAuth()),
    [adapter, isMock],
  );

  const success = useCallback(
    (user: SessionUser, method: LoginMethod) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("aiva.auth.user", user.id);
          localStorage.setItem("aiva.auth.profile", JSON.stringify(user));
          localStorage.removeItem("aiva.test.unauthenticated");
        }
      } catch {}
      if (onSuccess) return onSuccess(user, method);
      // v5.3 FX: วาร์ปออกจากโลโก้ + บอก SplashScreen ว่าเพิ่งเข้าสู่ระบบ (หลัง reload จะเล่นเอฟเฟกต์เข้าแอปแทน splash)
      markJustLoggedIn();
      loginOut(rootRef.current);
      router.replace(safeRedirect(redirectTo, LOGIN_CONFIG.defaultRedirect));
      router.refresh();
    },
    [onSuccess, redirectTo, router],
  );

  const support = useCallback(() => {
    if (LOGIN_CONFIG.supportUrl) window.open(LOGIN_CONFIG.supportUrl, "_blank", "noopener");
    else toasts.push("เปิดแบบฟอร์มแจ้ง IT Support");
  }, [toasts]);

  const c = useLogin({
    adapter: auth,
    defaultMethod: isMock ? "m365" : "ldap",
    onSuccess: success,
    initialError,
    initialNotice,
    onSupport: support,
    toast: toasts.push,
  });

  // วิธีเข้าสู่ระบบที่ server รองรับ · Microsoft 365 ใช้ได้เมื่อ ENTRA_* ครบ (โหมด mock แสดงทั้งสองเสมอ)
  useEffect(() => {
    if (isMock) return;
    let alive = true;
    fetch("/api/auth/providers", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Providers | null) => {
        if (!alive) return;
        const next = { ldap: p?.ldap !== false, m365: !!p?.m365 };
        setProviders(next);
        if (!next.m365) c.forceMethod("ldap");
        else if (!query.error) c.forceMethod("m365");
      })
      .catch(() => alive && setProviders({ ldap: true, m365: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  // กลับมาจาก Microsoft สำเร็จ (/login?sso=1): server ตั้ง cookie แล้ว · อ่านโปรไฟล์จาก /api/auth/me แล้วเข้าแอป
  useEffect(() => {
    if (!query.sso) return;
    let alive = true;
    void verifySession().then((r) => {
      if (!alive) return;
      if (r.state !== "valid") {
        toasts.push("ลงชื่อเข้าใช้ด้วย Microsoft ไม่สำเร็จ · ลองอีกครั้ง");
        return;
      }
      const u = r.user;
      success(
        {
          id: u.id,
          name: u.name || u.id,
          email: u.email || "",
          role: (u.role || "EU") as SessionUser["role"],
          companies: u.companies || [],
          oracleAccounts: u.oracleAccounts || [],
        },
        "m365",
      );
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.sso]);

  const m365Available = isMock || providers === null || providers.m365;

  return (
    <div
      ref={rootRef}
      id="lg"
      className={`aiva-login${c.exiting ? " out" : ""}`}
      role="main"
      aria-label="เข้าสู่ระบบ AIVA Portal"
      data-busy={c.busy ? "1" : "0"}
      data-exiting={c.exiting ? "1" : "0"}
    >
      <span className="lg-orb" aria-hidden="true" />
      <i className="lg-grid" aria-hidden="true" />
      <ProgressBar p={c.progress} />
      <div className="lg-stage">
        <div className="d3">
          <LoginForm c={c} mock={isMock} onSupport={support} m365Available={m365Available} />
          {showExplainer && <HowItWorks />}
        </div>
      </div>
      <Toasts items={toasts.items} />
    </div>
  );
}
