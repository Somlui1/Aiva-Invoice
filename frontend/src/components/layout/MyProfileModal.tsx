'use client'

/* =====================================================================
   v5.3.1 · MyProfileModal
   BUG FIX: modal เดิม render อยู่ "ข้างใน" <header class="topbar">
   ซึ่ง theme v5.2 ใส่ backdrop-filter:blur() (กระจกฝ้า) ให้ .topbar
   → CSS สร้าง containing block ใหม่ให้ลูกที่เป็น position:fixed
   → overlay inset:0 จึงถูกจำกัดให้อยู่แค่กรอบ topbar (สูง 52px) ไม่ใช่เต็มจอ
     เห็นเป็นแถบเบลอ + เนื้อหา modal โผล่ครึ่ง ๆ ด้านหลัง (ตามภาพ)
   วิธีแก้: render ผ่าน createPortal ไปที่ document.body (หลุดจาก topbar)
   + ใช้โครง modal ของ aiva-react (.ov.on > .modal > .mh/.mb/.mf) แทน inline style
   + ปิดด้วย Esc / คลิกพื้นหลัง / ปุ่ม ✕ / ปุ่ม "ปิด" · ล็อก scroll ด้านหลัง
   ข้อความ, aria-label และข้อมูลที่แสดง = เหมือนเดิมทุกอย่าง (test เดิมผ่าน)
   ===================================================================== */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { PERMISSION_DESCRIPTIONS, acctsOf } from '../../mock/users'
import { Icon } from '../common/Icon'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function MyProfileModal({ isOpen, onClose }: Props) {
  const { currentUser, currentRole } = useAuth()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    const t = window.setTimeout(() => boxRef.current?.focus(), 20)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      try {
        prevFocus?.focus?.()
      } catch {}
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const accounts = acctsOf(currentUser)
  const isEu = currentUser.role === 'EU'

  return createPortal(
    <div
      className="ov on pf-ov"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={boxRef}
        tabIndex={-1}
        className="modal pf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pfTitle"
      >
        {/* Header */}
        <div className="mh">
          <span className="mi" style={{ background: currentRole.bg, color: currentRole.c }}>
            <Icon name="user" />
          </span>
          <div className="grow pf-ht">
            <h3 id="pfTitle">ข้อมูลและสิทธิ์การใช้งานของฉัน</h3>
            <p>โปรไฟล์ผู้ใช้และขอบเขตสิทธิ์ตามบทบาทองค์กร (RBAC)</p>
          </div>
          <button type="button" className="ibtn" onClick={onClose} aria-label="ปิดหน้าต่างโปรไฟล์" title="ปิด (Esc)">
            <Icon name="x" />
          </button>
        </div>

        {/* Body */}
        <div className="mb pf-body">
          <div className="pf-id">
            <div>
              <span className="pf-l">ชื่อ - นามสกุล</span>
              <span className="pf-v b">{currentUser.n}</span>
            </div>
            <div>
              <span className="pf-l">บทบาท (Role)</span>
              <span className="role-pill" style={{ background: currentRole.bg, color: currentRole.c }}>
                {currentRole.n}
              </span>
            </div>
            <div>
              <span className="pf-l">อีเมลองค์กร (Entra ID)</span>
              <span className="pf-v mono pf-mail">{currentUser.email}</span>
            </div>
            <div>
              <span className="pf-l">หน่วยงาน / สังกัด</span>
              <span className="pf-v">{currentUser.unit || '—'}</span>
            </div>
            {currentUser.emp && (
              <div>
                <span className="pf-l">รหัสพนักงาน</span>
                <span className="pf-v mono">{currentUser.emp}</span>
              </div>
            )}
          </div>

          <section className="pf-card">
            <h4>ขอบเขตข้อมูลที่เข้าถึงได้ (Scope Access)</h4>
            <div className="pf-row">
              <span className="pf-k">บริษัทที่รับผิดชอบ:</span>
              <div className="pf-chips">
                {currentUser.co.length > 0 ? (
                  currentUser.co.map(c => (
                    <span key={c} className="co">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="muted">ทุกบริษัท (ผู้ดูแลระบบ)</span>
                )}
              </div>
            </div>
            {isEu && (
              <div className="pf-row">
                <span className="pf-k">Oracle Receiver:</span>
                <div className="pf-chips">
                  {accounts.length > 0 ? (
                    accounts.map(a => (
                      <span key={a} className="pf-acct">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="muted">— ยังไม่มีบัญชีเชื่อมโยง</span>
                  )}
                </div>
              </div>
            )}
          </section>

          <section>
            <h4 className="pf-h4">สิทธิ์ที่ได้รับอนุญาต ({currentRole.p.length} รายการ)</h4>
            <div className="tbl-wrap pf-perm">
              <table className="t">
                <thead>
                  <tr>
                    <th className="pf-c">สถานะ</th>
                    <th style={{ width: 150 }}>รหัสสิทธิ์</th>
                    <th>คำอธิบายสิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRole.p.map(perm => (
                    <tr key={perm}>
                      <td className="pf-c pf-ok">
                        <Icon name="check" size="sm" />
                      </td>
                      <td className="mono b">{perm}</td>
                      <td>{PERMISSION_DESCRIPTIONS[perm] || perm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mf">
          <button type="button" className="btn btn-sec" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default MyProfileModal
