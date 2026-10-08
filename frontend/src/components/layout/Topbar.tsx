import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'

interface TopbarProps {
  isNavCollapsed: boolean
  onToggleNav: () => void
}

export function Topbar({ onToggleNav }: TopbarProps) {
  const { currentUser, currentRole, users, switchUser } = useAuth()

  return (
    <header className="topbar">
      <button
        type="button"
        className="ibtn"
        onClick={onToggleNav}
        title="ย่อ / ขยายเมนู"
        aria-label="ย่อ / ขยายเมนู"
      >
        <Icon name="menu" size="lg" />
      </button>

      <div className="brand">
        <span className="brand-mark">AI</span>
        <div>
          <div className="brand-name">
            AIVA Portal <span className="brand-ver">v4.18</span>
          </div>
          <div className="brand-sub">SRS v1.1 · ตั้งค่า + การผูกบัญชี</div>
        </div>
      </div>

      <span className="grow" />

      <span className="env" title="ข้อมูลทั้งหมดเป็นค่าสมมติ">
        <i />
        Mock Prototype
      </span>

      <div className="who">
        <span
          className="role-pill"
          id="rolebadge"
          style={{ background: currentRole.bg, color: currentRole.c }}
        >
          {currentRole.n}
        </span>
        <label className="sr" htmlFor="user-selector">
          สลับผู้ใช้ (mockup)
        </label>
        <select
          id="user-selector"
          className="user-sel"
          value={currentUser.id}
          onChange={e => switchUser(e.target.value)}
          aria-label="สลับผู้ใช้"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.n} — {u.unit || u.role}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}

export default Topbar
