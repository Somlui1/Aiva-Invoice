'use client'

/** v5.12 — "มีเอกสารใหม่" strip above the queue. Never reloads by itself; the user decides. */
import { useState } from 'react'
import { Icon } from '../common/Icon'
import { useLive } from '../../context/LiveContext'

export function QueueLiveBanner() {
  const { pendingNew, pendingChanged, applyPending, dismissPending, state } = useLive()
  const [busy, setBusy] = useState(false)
  const n = pendingNew.length
  const c = pendingChanged.length
  if (!n && !c) return state === 'polling' ? (
    <div className="qlb off" role="status">
      <span className="qlb-dot" aria-hidden="true" />
      <span>การแจ้งเตือนสดขาดการเชื่อมต่อ · ตรวจหาเอกสารใหม่ทุก 60 วินาที</span>
    </div>
  ) : null

  const text = [n ? `เอกสารใหม่ ${n} รายการ` : '', c ? `มีการเปลี่ยนสถานะ ${c} รายการ` : ''].filter(Boolean).join(' · ')
  return (
    <div className="qlb" role="status" aria-live="polite">
      <span className="qlb-ic" aria-hidden="true">
        <Icon name="inbox" size="sm" />
      </span>
      <span className="qlb-t">
        <b>{text}</b>
        <span className="qlb-sub">รายการบนหน้าจอยังไม่เปลี่ยนจนกว่าจะกดโหลด</span>
      </span>
      <button
        type="button"
        className="btn btn-primary sm"
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true)
          await applyPending().finally(() => setBusy(false))
        }}
      >
        <Icon name="refresh" size="sm" /> {busy ? 'กำลังโหลด…' : 'โหลดรายการ'}
      </button>
      <button type="button" className="btn btn-ghost sm" onClick={dismissPending} disabled={busy}>
        ภายหลัง
      </button>
    </div>
  )
}

export default QueueLiveBanner
