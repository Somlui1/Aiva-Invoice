"use client";

import { ROLES, USERS } from "./data/demo";
import type { MockControls, MockSim } from "./auth/mock";
import { Icon } from "./ui/Icon";

interface Props {
  value: MockControls;
  onChange: (v: MockControls) => void;
  onSkip: () => void;
}

/** แถบทดสอบ (เฉพาะโหมด mock) · เลือกผลจำลองและบัญชี Microsoft ทดสอบ */
export function MockBar({ value, onChange, onSkip }: Props) {
  return (
    <div className="lg-dev">
      <b className="tg">MOCK</b>
      <label>
        ผลจำลอง
        <select aria-label="ผลจำลอง" value={value.sim} onChange={(e) => onChange({ ...value, sim: e.target.value as MockSim })}>
          <option value="auto">ตามข้อมูลที่กรอก</option>
          <option value="cred">รหัสผ่านผิด / ยืนยันไม่ผ่าน</option>
          <option value="noaccess">ยืนยันผ่าน แต่ไม่มีสิทธิ์ใช้งาน</option>
          <option value="timeout">ระบบยืนยันตัวตนไม่ตอบสนอง</option>
        </select>
      </label>
      <label>
        บัญชี Microsoft ทดสอบ
        <select aria-label="บัญชี Microsoft ทดสอบ" value={value.acct} onChange={(e) => onChange({ ...value, acct: e.target.value })}>
          {USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.n} · {ROLES[u.role].n}
            </option>
          ))}
        </select>
      </label>
      <span>
        LDAP ชื่อผู้ใช้ = ส่วนหน้าอีเมล เช่น <code>somsak.j</code> · รหัสผ่านทดสอบ <code>1234</code>
      </span>
      <span className="grow" />
      <button type="button" className="lg-btn sec sm" onClick={onSkip}>
        <Icon name="arrowr" size="sm" />
        ข้ามหน้า login
      </button>
    </div>
  );
}
