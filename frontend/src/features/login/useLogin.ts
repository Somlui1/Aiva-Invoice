"use client";

import { createElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { AuthAdapter, AuthFailKind, AuthResult, LoginMethod, SessionUser } from "./auth/types";
import { LOGIN_CONFIG } from "./config";
import { ROLES } from "./data/demo";

export type AlertKind = "ok" | "info" | "warn" | "err";

export interface AlertAction {
  label: string;
  run: () => void;
}

export interface AlertState {
  kind: AlertKind;
  title: string;
  message: ReactNode;
  actions: AlertAction[];
  /** เปลี่ยนค่าเพื่อให้กล่องสั่น (shake) ใหม่ */
  shake: number;
}

export interface ProgressState {
  width: number;
  ms: number;
  visible: boolean;
  error: boolean;
}

interface Options {
  adapter: AuthAdapter;
  onSuccess: (user: SessionUser, method: LoginMethod) => void;
  defaultMethod?: LoginMethod;
  /** ข้อผิดพลาดจากการ redirect กลับมา (เช่น /login?error=noaccess) */
  initialError?: AuthFailKind | null;
  onSupport: () => void;
  toast: (msg: string) => void;
}

const sleep = (ms: number) =>
  new Promise<void>((r) => {
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(r, reduce ? Math.min(ms, 120) : ms);
  });

const b = (n: ReactNode) => createElement("strong", null, n);

/**
 * ตัวควบคุมหน้า Login (state machine)
 * idle → busy → (สำเร็จ → exiting → onSuccess) | (ไม่สำเร็จ → idle + alert) | (ผิดครบ maxFail → locked)
 */
export function useLogin({ adapter, onSuccess, defaultMethod = "m365", initialError, onSupport, toast }: Options) {
  const [method, setMethod] = useState<LoginMethod>(defaultMethod);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyMethod, setBusyMethod] = useState<LoginMethod | null>(null);
  const [exiting, setExiting] = useState(false);
  const [fieldErr, setFieldErr] = useState<{ U?: string; P?: string }>({});
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [lockUntil, setLockUntil] = useState(0);
  const [progress, setProgress] = useState<ProgressState>({ width: 0, ms: 0, visible: false, error: false });

  const fails = useRef(0);
  const lockTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  /** ให้ปุ่ม “ลองอีกครั้ง” เรียก go() ตัวล่าสุดเสมอ (ไม่ใช้ค่า state เก่าที่ค้างใน closure) */
  const goRef = useRef<(m: LoginMethod) => Promise<void>>(async () => {});

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (lockTimer.current) clearInterval(lockTimer.current);
      if (trickle.current) clearInterval(trickle.current);
    };
  }, []);

  // จำชื่อผู้ใช้ (อ่านหลัง mount เพื่อไม่ให้ hydration ไม่ตรงกัน)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOGIN_CONFIG.rememberKey);
      if (saved) {
        setUsername(saved);
        setKeep(true);
      }
    } catch {
      /* private mode: ไม่จำ */
    }
  }, []);

  const showAlert = useCallback((kind: AlertKind, title: string, message: ReactNode, actions: AlertAction[] = [], shake = false) => {
    setAlert((prev) => ({ kind, title, message, actions, shake: shake ? (prev?.shake ?? 0) + 1 : prev?.shake ?? 0 }));
  }, []);
  const clearAlert = useCallback(() => setAlert(null), []);

  /* ---------------- แถบความคืบหน้าบนสุด ---------------- */
  const barStart = () => {
    if (trickle.current) clearInterval(trickle.current);
    setProgress({ width: 14, ms: 350, visible: true, error: false });
    let w = 14;
    trickle.current = setInterval(() => {
      w += (90 - w) * 0.3;
      setProgress({ width: w, ms: 560, visible: true, error: false });
    }, 560);
  };
  const barEnd = (error: boolean) => {
    if (trickle.current) clearInterval(trickle.current);
    setProgress({ width: 100, ms: 180, visible: true, error });
    setTimeout(() => {
      if (!alive.current) return;
      setProgress((p) => ({ ...p, visible: false }));
      setTimeout(() => alive.current && setProgress({ width: 0, ms: 0, visible: false, error: false }), 320);
    }, error ? 900 : 260);
  };

  /* ---------------- ล็อกชั่วคราว ---------------- */
  const startLock = useCallback(
    (seconds: number, reason: "fails" | "server") => {
      const until = Date.now() + seconds * 1000;
      setLockUntil(until);
      if (lockTimer.current) clearInterval(lockTimer.current);
      const tick = () => {
        const s = Math.ceil((until - Date.now()) / 1000);
        if (s <= 0) {
          if (lockTimer.current) clearInterval(lockTimer.current);
          fails.current = 0;
          setLockUntil(0);
          clearAlert();
          return;
        }
        showAlert(
          "err",
          "ถูกล็อกชั่วคราว",
          reason === "fails"
            ? createElement("span", null, `ใส่รหัสผิดครบ ${LOGIN_CONFIG.maxFail} ครั้ง · ลองใหม่ได้ใน `, b(s), " วินาที หรือติดต่อ IT Support")
            : createElement("span", null, "บัญชีนี้ถูกล็อกชั่วคราว · ลองใหม่ได้ใน ", b(s), " วินาที หรือติดต่อ IT Support"),
          [{ label: "ติดต่อ IT Support", run: onSupport }],
        );
      };
      tick();
      lockTimer.current = setInterval(tick, 1000);
    },
    [clearAlert, onSupport, showAlert],
  );

  const locked = lockUntil > Date.now();

  /* ---------------- เมนูช่วยเหลือ ---------------- */
  const forgot = useCallback(() => {
    showAlert(
      "info",
      "รีเซ็ตรหัสผ่าน",
      "บัญชี LDAP รีเซ็ตโดย IT Support · บัญชี Microsoft รีเซ็ตเองได้ที่หน้าลงชื่อเข้าใช้ของ Microsoft",
      [{ label: "แจ้ง IT Support", run: onSupport }],
    );
  }, [onSupport, showAlert]);

  const switchMethod = useCallback(
    (m: LoginMethod) => {
      if (busy || exiting) return;
      setMethod(m);
      clearAlert();
      setFieldErr({});
    },
    [busy, clearAlert, exiting],
  );

  // โฟกัสช่องชื่อผู้ใช้เมื่อสลับไป LDAP
  useEffect(() => {
    if (method === "ldap") userRef.current?.focus({ preventScroll: true });
  }, [method]);

  // Alt+1 = Microsoft 365 · Alt+2 = LDAP
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || exiting || !e.altKey || (e.key !== "1" && e.key !== "2")) return;
      e.preventDefault();
      switchMethod(e.key === "1" ? "m365" : "ldap");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, exiting, switchMethod]);

  /* ---------------- ผลไม่สำเร็จ ---------------- */
  const fail = useCallback(
    (m: LoginMethod, r: Extract<AuthResult, { ok: false }>) => {
      const identity = m === "ldap" ? username.trim() : "";
      const label = m === "m365" ? "Microsoft 365" : "LDAP";
      setBusy(false);
      setBusyMethod(null);
      setPassword("");
      barEnd(true);

      if (r.kind === "locked") {
        adapter.reportFailure?.({ method: m, identity, kind: "locked", detail: `${label} · บัญชีถูกล็อก` });
        startLock(r.retryAfterSec, "server");
        return;
      }

      if (r.kind === "timeout") {
        adapter.reportFailure?.({ method: m, identity, kind: "timeout", detail: `${label} · ระบบยืนยันตัวตนไม่ตอบสนอง` });
        showAlert(
          "warn",
          m === "ldap" ? "เชื่อมต่อเซิร์ฟเวอร์ LDAP ไม่ได้" : "เชื่อมต่อ Microsoft ไม่ได้",
          m === "ldap"
            ? "เซิร์ฟเวอร์ภายในไม่ตอบสนองภายใน 10 วินาที ลองอีกครั้ง หรือใช้ Microsoft 365 แทน"
            : "ไม่ได้รับการตอบกลับจาก Microsoft ลองอีกครั้ง หรือใช้บัญชีภายใน (LDAP) แทน",
          [
            { label: "ลองอีกครั้ง", run: () => void goRef.current(m) },
            { label: m === "ldap" ? "ใช้ Microsoft 365" : "ใช้ LDAP", run: () => switchMethod(m === "ldap" ? "m365" : "ldap") },
          ],
          true,
        );
        return;
      }

      if (r.kind === "cred") {
        fails.current += 1;
        const left = LOGIN_CONFIG.maxFail - fails.current;
        adapter.reportFailure?.({
          method: m,
          identity,
          kind: "cred",
          detail: `${label} · ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (${fails.current}/${LOGIN_CONFIG.maxFail})`,
        });
        if (left <= 0) {
          startLock(LOGIN_CONFIG.lockSeconds, "fails");
        } else {
          showAlert(
            "err",
            m === "ldap" ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" : "ลงชื่อเข้าใช้ด้วย Microsoft ไม่สำเร็จ",
            createElement(
              "span",
              null,
              (m === "ldap" ? "ตรวจตัวพิมพ์และภาษาแป้นพิมพ์อีกครั้ง · " : "ยกเลิกหรือยืนยันตัวตนไม่ผ่าน · ") + "เหลืออีก ",
              b(left),
              " ครั้งก่อนถูกล็อกชั่วคราว",
            ),
            [{ label: "ลืมรหัสผ่าน?", run: forgot }],
            true,
          );
        }
        if (m === "ldap") {
          setFieldErr({ P: "รหัสผ่านไม่ถูกต้อง" });
          passRef.current?.focus();
        }
        return;
      }

      // noaccess
      adapter.reportFailure?.({ method: m, identity, kind: "noaccess", detail: `${label} · ยืนยันตัวตนผ่าน แต่ไม่มีบทบาทใน Portal` });
      showAlert(
        "warn",
        "บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน AIVA Portal",
        "ยืนยันตัวตนผ่านแล้ว แต่ไม่พบบัญชีในกลุ่มสิทธิ์ที่ได้รับอนุญาต · ให้ IT Admin เพิ่มบัญชีและผูก Oracle account ให้ก่อน",
        [{ label: "ขอสิทธิ์จาก IT Admin", run: () => toast("ส่งคำขอสิทธิ์ถึง IT Admin แล้ว") }],
        true,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adapter, forgot, showAlert, startLock, switchMethod, toast, username],
  );

  /* ---------------- เข้าสู่ระบบ ---------------- */
  const go = useCallback(
    async (m: LoginMethod) => {
      if (busy || exiting || locked) return;
      clearAlert();
      setMethod(m);

      if (m === "ldap") {
        const errs: { U?: string; P?: string } = {};
        if (!username.trim()) errs.U = "กรอกชื่อผู้ใช้";
        if (!password) errs.P = "กรอกรหัสผ่าน";
        setFieldErr(errs);
        if (errs.U || errs.P) {
          (errs.U ? userRef : passRef).current?.focus();
          return;
        }
      }

      setBusy(true);
      setBusyMethod(m);
      barStart();

      let res: AuthResult;
      try {
        res = m === "ldap" ? await adapter.loginLdap({ username: username.trim(), password }) : await adapter.loginMicrosoft();
      } catch {
        res = { ok: false, kind: "timeout" };
      }
      if (!alive.current) return;

      if (!res.ok) return fail(m, res);

      // สำเร็จ
      fails.current = 0;
      setPassword("");
      barEnd(false);
      showAlert("ok", "เข้าสู่ระบบสำเร็จ", `${res.user.name} · ${ROLES[res.user.role]?.n ?? res.user.role}`);
      setExiting(true);
      try {
        if (m === "ldap" && keep && username.trim()) window.localStorage.setItem(LOGIN_CONFIG.rememberKey, username.trim());
        else if (m === "ldap" && !keep) window.localStorage.removeItem(LOGIN_CONFIG.rememberKey);
      } catch {
        /* ไม่จำ */
      }
      await sleep(800);
      if (!alive.current) return;
      onSuccess(res.user, m);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adapter, busy, exiting, fail, keep, locked, onSuccess, password, username],
  );

  goRef.current = go;

  /** reset สถานะผิดพลาด (ใช้เมื่อเปลี่ยนผลจำลองในแถบ MOCK) */
  const resetFailures = useCallback(() => {
    if (busy) return;
    fails.current = 0;
    clearAlert();
  }, [busy, clearAlert]);

  // แสดงข้อผิดพลาดที่ได้จากการ redirect กลับมา (เช่น Microsoft ไม่ผ่าน)
  useEffect(() => {
    if (!initialError) return;
    if (initialError === "noaccess")
      showAlert("warn", "บัญชีนี้ยังไม่ได้รับสิทธิ์ใช้งาน AIVA Portal", "ยืนยันตัวตนผ่านแล้ว แต่ไม่พบบัญชีในกลุ่มสิทธิ์ที่ได้รับอนุญาต · ให้ IT Admin เพิ่มบัญชีและผูก Oracle account ให้ก่อน");
    else if (initialError === "timeout")
      showAlert("warn", "เชื่อมต่อ Microsoft ไม่ได้", "ไม่ได้รับการตอบกลับจาก Microsoft ลองอีกครั้ง หรือใช้บัญชีภายใน (LDAP) แทน");
    else showAlert("err", "ลงชื่อเข้าใช้ด้วย Microsoft ไม่สำเร็จ", "ยกเลิกหรือยืนยันตัวตนไม่ผ่าน · ลองอีกครั้ง");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialError]);

  return {
    method,
    username,
    password,
    keep,
    busy,
    busyMethod,
    exiting,
    locked,
    fieldErr,
    alert,
    progress,
    userRef,
    passRef,
    setUsername: (v: string) => {
      setUsername(v);
      setFieldErr((e) => ({ ...e, U: undefined }));
    },
    setPassword: (v: string) => {
      setPassword(v);
      setFieldErr((e) => ({ ...e, P: undefined }));
    },
    setKeep,
    switchMethod,
    go,
    forgot,
    resetFailures,
  };
}

export type LoginController = ReturnType<typeof useLogin>;
