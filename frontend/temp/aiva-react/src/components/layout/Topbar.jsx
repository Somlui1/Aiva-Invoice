import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Icon } from '../common/Icon.jsx';

export function Topbar({ currentPage = 'queue' }) {
  const { currentUser, switchUser, users } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const pageTitles = {
    queue: 'คิวตรวจสอบ',
    ap: 'ส่งเข้า AP Interface',
    rbac: 'สิทธิ์และการเชื่อมบัญชี',
    audit: 'บันทึกการเข้าถึง',
    settings: 'ตั้งค่าระบบ',
    cases: 'ชุดเอกสารทดสอบ',
    std: 'มาตรฐาน Payload',
    sim: 'Document Simulation'
  };

  return (
    <header className="topbar">
      <div className="crumb" title="AIVA · Auto Invoice Matching">
        <i className="d"></i>
        <b>AIVA</b>
        <svg className="sep" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6"></path>
        </svg>
        <span className="pg-t" id="crumbT">{pageTitles[currentPage] || 'คิวตรวจสอบ'}</span>
      </div>

      <button type="button" className="cmdk-btn" aria-label="ค้นหา / คำสั่ง" title="ค้นหา / คำสั่ง (Ctrl K)">
        <Icon name="search" size={16} className="ico" />
        <span>ค้นหาเอกสาร / คำสั่ง…</span>
        <span className="kk">
          <kbd>Ctrl</kbd><kbd>K</kbd>
        </span>
      </button>

      <span className="grow"></span>

      {/* Theme Toggle Button */}
      <button
        type="button"
        className="ibtn"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light)' : 'สลับเป็นโหมดมืด (Dark)'}
        aria-label="Toggle theme"
        style={{ marginRight: 8 }}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>

      {/* User Switcher */}
      <div className="who">
        <span className="role-pill" id="rolebadge">{currentUser?.role}</span>
        <select
          className="user-sel"
          id="user"
          value={currentUser?.id || 'u1'}
          onChange={(e) => switchUser(e.target.value)}
          aria-label="สลับผู้ใช้"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

export default Topbar;
