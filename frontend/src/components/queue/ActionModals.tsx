'use client'

import { useState } from 'react'
import { InvoiceDoc } from '../../types/invoice'
import { ActionType, ACTION_CONFIG, ACTION_REASONS } from '../../mock/rules'
import { useToastModal } from '../../context/ToastModalContext'
import { useInvoices } from '../../context/InvoiceContext'
import { confirmNeedsReason } from '../../lib/queueFilters'

interface ActionModalsProps {
  doc: InvoiceDoc
  action: ActionType | null
  onClose: () => void
}

export function ActionModalDialog({ doc, action, onClose }: ActionModalsProps) {
  const { executeAction, hasHighSeverity } = useInvoices()
  const { toast } = useToastModal()

  const [reason, setReason] = useState<string>(() => {
    if (!action) return ''
    return (ACTION_REASONS[action] || [])[0] || ''
  })
  const [note, setNote] = useState<string>('')
  const [uploadFile, setUploadFile] = useState<string>(`${doc.inv}_rev.pdf`)
  const [simOutcome, setSimOutcome] = useState<string>('Auto-pass')
  // v5.13: one request per click — a second click while the first is in flight did a second POST (409 toast)
  const [busy, setBusy] = useState(false)

  if (!action) return null

  const cfg = ACTION_CONFIG[action]
  const reasons = ACTION_REASONS[action] || []
  const high = hasHighSeverity(doc)
  const receiverWork = action === 'confirm' ? confirmNeedsReason(doc) : null
  const isNoteRequired =
    !!receiverWork ||
    // v5.11: same rule as the server (transitionFor.reasonRequired) — Hold and a Manual Review decision
    (action === 'confirm' && (high || doc.status === 'Hold' || doc.status === 'Manual Review')) ||
    ['review', 'hold', 'reject', 'unconfirm', 'returnf'].includes(action)

  const handleConfirm = async () => {
    if (busy) return
    if (isNoteRequired && !note.trim()) {
      toast('กรุณาระบุหมายเหตุ', true)
      return
    }

    setBusy(true)
    let res: { ok: boolean; msg: string }
    try {
      res = await executeAction(
        doc.doc,
        action,
        reason,
        note.trim(),
        action === 'upload' ? simOutcome : undefined,
        action === 'upload' ? uploadFile : undefined
      )
    } finally {
      setBusy(false)
    }

    if (res.ok) {
      onClose()
    }
  }

  return (
    <div className="ov on" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="mh">
          <span className="mi" style={{ background: cfg.bg, color: cfg.c }}>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>•</span>
          </span>
          <div>
            <h4 id="mtitle">{cfg.title} · {doc.inv}</h4>
            <p>{doc.vendor} · {doc.total.toLocaleString()} ฿ · สถานะ {doc.status}</p>
          </div>
        </div>

        <div className="mb">
          {action === 'unconfirm' && (
            <div className="note w" role="note" data-testid="unconfirm-note">
              <span>
                เอกสารจะ<b>ออกจากรายการรอส่ง</b>และกลับไปที่<b>คิวตรวจสอบ สถานะ Review</b> · ใบรับ{' '}
                <b className="mono">{doc.rcv || '—'}</b> จะว่างให้ Confirm ใหม่ได้ · เอกสารอื่นที่เป็น Duplicate ของใบรับนี้ยังคงเป็น Duplicate
              </span>
            </div>
          )}
          {action === 'upload' && (
            <>
              <label htmlFor="fl">ไฟล์เอกสารใหม่</label>
              <input
                id="fl"
                className="inp"
                value={uploadFile}
                onChange={e => setUploadFile(e.target.value)}
              />
              <label htmlFor="sim">ผลตรวจ AIVA ของฉบับใหม่ (จำลอง)</label>
              <select
                id="sim"
                className="sel"
                value={simOutcome}
                onChange={e => setSimOutcome(e.target.value)}
              >
                <option value="Auto-pass">Auto-pass</option>
                <option value="Review">Review</option>
                <option value="Hold">Hold</option>
                <option value="Manual Review">Manual Review</option>
              </select>
            </>
          )}

          <label htmlFor="rs">
            เหตุผล <span className="req">*</span>
          </label>
          <select
            id="rs"
            className="sel"
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            {reasons.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {receiverWork && (
            <div className="note w" role="note">
              <span>{receiverWork}</span>
            </div>
          )}
          <label htmlFor="nt">
            หมายเหตุ{isNoteRequired && <span className="req"> * จำเป็น</span>}
          </label>
          <textarea
            id="nt"
            className="set-ta"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </div>

        <div className="mf">
          <button type="button" className="btn btn-sec" onClick={onClose} disabled={busy}>
            {action === 'unconfirm' ? 'ไม่ยกเลิก' : 'ยกเลิก'}
          </button>
          <button
            type="button"
            className={`btn ${cfg.btnClass}`}
            onClick={handleConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'กำลังบันทึก…' : cfg.btnText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActionModalDialog
