"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { LoginAlert } from "./LoginAlert";
import { LOGIN_CONFIG } from "./config";
import { BrandTile } from "../../components/shell/BrandTile";
import { LangSwitch } from "../../components/shell/LangSwitch";
import { ThemeSwitch } from "../../components/shell/ThemeSwitch";
import { Icon } from "./ui/Icon";
import { MicrosoftLogo } from "./ui/MicrosoftLogo";
import type { LoginController } from "./useLogin";

interface Props {
  c: LoginController;
  mock: boolean;
  onSupport: () => void;
  /** v5.7: server ตั้งค่า Microsoft 365 (Entra ID) แล้วหรือยัง · false = ปิดแท็บ Microsoft 365 */
  m365Available?: boolean;
}

/** ฝั่งซ้ายของหน้า Login: เลือกวิธี (Microsoft 365 / LDAP) + ฟอร์ม + กล่องแจ้งผล */
export function LoginForm({ c, mock, onSupport, m365Available = true }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);

  const disabled = c.busy || c.locked || c.exiting;
  const busyMs = c.busy && c.busyMethod === "m365";
  const busyLdap = c.busy && c.busyMethod === "ldap";

  const onCaps = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void c.go("ldap");
  };

  return (
    <section className="d3-l" id="lp">
      <div className="lg-hero">
        <BrandTile size="md" />
        <div>
          <div className="wm wordmark">
            AIVA
          </div>
          <div className="tg">Auto Invoice Matching</div>
          <div className="pp2">
            <em>OCR</em>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <em>Match</em>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <em>Post to Oracle</em>
          </div>
        </div>
      </div>
      {/* v5.14.1: ภาษา (TH | EN) ใช้ค่าเดียวกับ ตั้งค่า › ตั้งค่าทั่วไป และปุ่มบน Topbar — เลือกที่นี่แล้วหน้า login ทั้งหน้าสลับภาษา */}
      <div className="lg-theme lg-prefs">
        <LangSwitch />
        <ThemeSwitch />
      </div>

      <div className="mid">
        <div>
          <h1 className="lg-h1">เข้าสู่ระบบ</h1>
          <p className="lg-sub">เลือกวิธีที่องค์กรกำหนดให้คุณ</p>
        </div>

        <div className="seg lg-seg" role="tablist" aria-label="วิธีเข้าสู่ระบบ">
          <button
            type="button"
            role="tab"
            aria-selected={c.method === "m365"}
            className={c.method === "m365" ? "on" : ""}
            disabled={!m365Available}
            title={m365Available ? undefined : "ผู้ดูแลระบบยังไม่ได้ตั้งค่า Microsoft 365 (Entra ID)"}
            onClick={() => c.switchMethod("m365")}
          >
            <MicrosoftLogo />
            Microsoft 365 <kbd>Alt+1</kbd>
          </button>
          <button type="button" role="tab" aria-selected={c.method === "ldap"} className={c.method === "ldap" ? "on" : ""} onClick={() => c.switchMethod("ldap")}>
            <Icon name="server" size="sm" />
            LDAP ภายใน <kbd>Alt+2</kbd>
          </button>
        </div>

        <div id="mp">
          {c.method === "m365" ? (
            <div>
              <button
                type="button"
                className={`lg-msbtn go ${busyMs ? "is-busy" : ""}`}
                data-m="m365"
                disabled={disabled || !m365Available}
                onClick={() => void c.go("m365")}
              >
                <MicrosoftLogo />
                <span className="t">{busyMs ? "กำลังเปลี่ยนเส้นทางไปที่ Microsoft…" : "ลงชื่อเข้าใช้ด้วย Microsoft"}</span>
                <span className="spn" aria-hidden="true" />
              </button>
              <div className="lg-msnote">
                <Icon name="shield" size="sm" />
                {m365Available
                  ? "บัญชีที่ทำงานหรือโรงเรียน · Single Sign-On · รองรับ MFA"
                  : "Microsoft 365 ยังไม่เปิดใช้งานบนเซิร์ฟเวอร์นี้ · ใช้ LDAP ภายในแทน"}
              </div>
            </div>
          ) : (
            <form className="lg-form" onSubmit={submit} noValidate>
              <div className="lg-f">
                <label htmlFor="lgU">
                  ชื่อผู้ใช้ <span className="hint">LDAP · เช่น wajeepradit.p</span>
                </label>
                <div className={`lg-in ${c.fieldErr.U ? "bad" : ""}`} id="wU">
                  <Icon name="user" />
                  <input
                    id="lgU"
                    ref={c.userRef}
                    value={c.username}
                    onChange={(e) => c.setUsername(e.target.value)}
                    readOnly={c.busy}
                    autoComplete="username"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="ชื่อผู้ใช้ภายในบริษัท"
                    aria-invalid={!!c.fieldErr.U}
                    aria-describedby="eU"
                  />
                </div>
                <div className="lg-err" id="eU" role="alert">
                  {c.fieldErr.U && (
                    <>
                      <Icon name="alert" size="sm" />
                      {c.fieldErr.U}
                    </>
                  )}
                </div>
              </div>

              <div className="lg-f">
                <label htmlFor="lgP">รหัสผ่าน</label>
                <div className={`lg-in ${c.fieldErr.P ? "bad" : ""}`} id="wP">
                  <Icon name="lock" />
                  <input
                    id="lgP"
                    ref={c.passRef}
                    type={showPw ? "text" : "password"}
                    value={c.password}
                    onChange={(e) => c.setPassword(e.target.value)}
                    onKeyDown={onCaps}
                    onKeyUp={onCaps}
                    readOnly={c.busy}
                    autoComplete="current-password"
                    placeholder="รหัสผ่าน"
                    aria-invalid={!!c.fieldErr.P}
                    aria-describedby="eP"
                  />
                  <button type="button" className="lg-eye" aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setShowPw((v) => !v)}>
                    <Icon name={showPw ? "eyeoff" : "eye"} />
                  </button>
                </div>
                {caps && (
                  <div className="lg-caps">
                    <Icon name="caps" size="sm" />
                    Caps Lock เปิดอยู่
                  </div>
                )}
                <div className="lg-err" id="eP" role="alert">
                  {c.fieldErr.P && (
                    <>
                      <Icon name="alert" size="sm" />
                      {c.fieldErr.P}
                    </>
                  )}
                </div>
              </div>

              <div className="lg-row">
                <label className="lg-chk">
                  <input type="checkbox" checked={c.keep} onChange={(e) => c.setKeep(e.target.checked)} />
                  จำชื่อผู้ใช้ในเครื่องนี้
                </label>
                <button type="button" className="lg-link" onClick={c.forgot}>
                  ลืมรหัสผ่าน?
                </button>
              </div>

              <button type="submit" className={`lg-btn primary block go ${busyLdap ? "is-busy" : ""}`} data-m="ldap" disabled={disabled}>
                <span className="t">{busyLdap ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}</span>
                <Icon name="arrowr" />
                <span className="spn" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        <LoginAlert alert={c.alert} />
      </div>

      <div className="lg-foot">
        <span>© 2026 AAPICO</span>
        <span>{LOGIN_CONFIG.versionLabel}</span>
        <button type="button" className="lg-link" onClick={onSupport}>
          ติดต่อ IT Support
        </button>
      </div>
    </section>
  );
}
