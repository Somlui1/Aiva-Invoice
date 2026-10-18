"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { FX } from "../../lib/fxEngine";
import { SplashScreen } from "@/components/layout/SplashScreen";
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
  const isMock = mock ?? LOGIN_CONFIG.mock;
  const toasts = useToasts();
  const [showSplash, setShowSplash] = useState(true);
  const [isEntering, setIsEntering] = useState(false);

  const [mockCtl, setMockCtl] = useState<MockControls>({ sim: "auto", acct: "u1" });
  const mockRef = useRef(mockCtl);
  mockRef.current = mockCtl;

  const auth = useMemo<AuthAdapter>(
    () => adapter ?? (mock === true ? createMockAuth(() => mockRef.current) : createHttpAuth()),
    [adapter, mock],
  );

  const success = useCallback(
    (user: SessionUser, method: LoginMethod) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("aiva.auth.user", user.id);
          localStorage.setItem("aiva.auth.profile", JSON.stringify(user));
          localStorage.removeItem("aiva.test.unauthenticated");
          FX.warp(window.innerWidth * 0.5, window.innerHeight * 0.4);
          FX.welcome({ n: user.name || user.id, role: user.role });
        }
      } catch {}
      if (onSuccess) return onSuccess(user, method);
      router.replace(safeRedirect(redirectTo, LOGIN_CONFIG.defaultRedirect));
      router.refresh();
    },
    [onSuccess, redirectTo, router],
  );

  const support = useCallback(() => {
    if (LOGIN_CONFIG.supportUrl) window.open(LOGIN_CONFIG.supportUrl, "_blank", "noopener");
    else toasts.push("เปิดแบบฟอร์มแจ้ง IT Support");
  }, [toasts]);

  const handleSplashDismiss = useCallback(() => {
    setShowSplash(false);
    setIsEntering(true);
    if (typeof window !== "undefined") {
      FX.loginIn();
      setTimeout(() => setIsEntering(false), 1500);
    }
  }, []);

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
      className={`aiva-login ${isEntering ? "lg-enter" : ""}`}
      id="lg"
      role="main"
      aria-label="เข้าสู่ระบบ AIVA Portal"
      data-busy={c.busy ? "1" : "0"}
      data-exiting={c.exiting ? "1" : "0"}
    >
      {showSplash && <SplashScreen onDismiss={handleSplashDismiss} />}
      <span className="lg-orb" aria-hidden="true" />
      <i className="lg-grid" aria-hidden="true" />
      <ProgressBar p={c.progress} />
      <div className="lg-stage" id="lgStage">
        <div className="d3">
          <LoginForm c={c} mock={isMock} onSupport={support} />
          {showExplainer && <HowItWorks />}
        </div>
      </div>
      <Toasts items={toasts.items} />
    </div>
  );
}
