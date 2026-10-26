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

export function LoginPage({ redirectTo, initialError = null, adapter, mock, showExplainer = true, onSuccess }: LoginPageProps) {
  const router = useRouter();
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
    onSupport: support,
    toast: toasts.push,
  });

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
          <LoginForm c={c} mock={isMock} onSupport={support} />
          {showExplainer && <HowItWorks />}
        </div>
      </div>
      <Toasts items={toasts.items} />
    </div>
  );
}
