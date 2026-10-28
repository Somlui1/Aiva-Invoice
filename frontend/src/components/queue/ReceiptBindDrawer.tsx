'use client'

/**
 * "ผูกใบรับ" — bind a receipt to a document that has none, then Confirm (v5.11).
 *
 * Right-side panel, so the PDF on the left stays visible for comparison. Three steps on one surface
 * (no nested cards): ค้นหา → ตรวจรายการ → ยืนยัน.
 *
 * The user does not know the receive_id; they search with what the invoice shows: supplier tax id
 * (or a PO, which leads to the supplier) + invoice number. The server answers ONE receipt with its
 * lines and what binding will do. The primary button names that outcome.
 *
 * Bug guards: any edit to the search fields clears the result (a stale receipt can never be bound);
 * the bind button is disabled while a request runs; the server re-runs the lookup and answers 409 if
 * the receipt or the outcome changed since the preview, in which case the preview is reloaded.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import type { InvoiceDoc } from '../../types/invoice'
import type { PortalOracleReceiptLine } from '../../features/engine/types/portalDomain'
import { useInvoices } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'

interface Preview {
  receipt: {
    receiveId: string
    receiptDate?: string | null
    supplierTaxId: string
    supplierName: string
    receiverName?: string | null
    companyCode?: string | null
    poNumbers: string[]
    total: number
    lines: PortalOracleReceiptLine[]
  }
  supplierFromPo: boolean
  invoiceTotal: number
  amountDiff: number
  outcome: {
    newStatus: 'Confirmed' | 'Duplicate'
    rule: string
    duplicateOf: { id: string; status: string } | null
    supersede: { id: string; status: string }[]
  }
}

const money = (n: number | null | undefined) =>
  n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const clean = (v: string | undefined | null) => (v && v !== '—' ? v : '')

export function ReceiptBindDrawer({ doc, onClose }: { doc: InvoiceDoc; onClose: () => void }) {
  const { refreshQueue, selectDoc } = useInvoices()
  const { toast } = useToastModal()
  const uid = useId()
  const unresolved = doc.identityStatus === 'UNRESOLVED'

  // OCR values as the starting point; empty for UNRESOLVED (the user reads the PDF and types).
  const [tax, setTax] = useState(unresolved ? '' : clean(doc.stax))
  const [inv, setInv] = useState(unresolved ? '' : clean(doc.inv))
  const [po, setPo] = useState(unresolved ? '' : clean(doc.po?.split(',')[0]?.trim()))
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [binding, setBinding] = useState(false)
  const firstField = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    firstField.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !binding) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, binding])

  /** Any edit invalidates the result: never bind a receipt found with other keys. */
  const edit = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(e.target.value)
    setPreview(null)
    setError(null)
  }

  const canSearch = !!inv.trim() && (!!tax.trim() || !!po.trim()) && !searching && !binding

  /** `force`: re-run after a 409 even though the bind request was still marked busy in this render. */
  const search = async (force = false) => {
    if (!force && !canSearch) return
    if (!inv.trim() || (!tax.trim() && !po.trim())) return
    setSearching(true)
    setError(null)
    setPreview(null)
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(doc.doc)}/receipt-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierTaxId: tax.trim() || null, invoiceNum: inv.trim(), poNumber: po.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) setError(data?.error || `ค้นหาไม่สำเร็จ (HTTP ${res.status})`)
      else setPreview(data as Preview)
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
    } finally {
      setSearching(false)
    }
  }

  const bind = async () => {
    if (!preview || !reason.trim() || binding) return
    setBinding(true)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${encodeURIComponent(doc.doc)}/bind-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierTaxId: tax.trim() || null,
          invoiceNum: inv.trim(),
          poNumber: po.trim() || null,
          reason: reason.trim(),
          expectedReceiveId: preview.receipt.receiveId,
          expectedStatus: preview.outcome.newStatus,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409) {
        // Someone else changed things since the preview: show the fresh answer, do not bind silently.
        setError(data?.error || 'ข้อมูลเปลี่ยนไประหว่างนี้')
        setBinding(false)
        await search(true)
        return
      }
      if (!res.ok || !data?.ok) {
        setError(data?.error || `ผูกใบรับไม่สำเร็จ (HTTP ${res.status})`)
        setBinding(false)
        return
      }
      toast(data.message || 'ผูกใบรับแล้ว', data.toStatus !== 'Confirmed')
      await refreshQueue()
      selectDoc(doc.doc)
      onClose()
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
      setBinding(false)
    }
  }

  const o = preview?.outcome
  const isDup = o?.newStatus === 'Duplicate'
  const billedLines = preview?.receipt.lines.filter(l => l.qtyBilled != null && l.qty > 0 && l.qtyBilled >= l.qty) ?? []
  const step = preview ? 3 : 1

  return (
    <aside className="rbd" role="dialog" aria-modal="false" aria-labelledby={`${uid}-t`}>
      <header className="rbd-h">
        <div>
          <h3 id={`${uid}-t`}>ผูกใบรับ · {doc.doc}</h3>
          <p className="rbd-sub">
            {doc.vendor || 'ไม่ทราบผู้ขาย'} · ยอดใบแจ้งหนี้ {money(doc.total)} ฿
          </p>
        </div>
        <button type="button" className="rbd-x" onClick={onClose} disabled={binding} aria-label="ปิด">
          <Icon name="x" size="sm" />
        </button>
      </header>

      <ol className="rbd-steps" aria-label="ขั้นตอน">
        <li className={step >= 1 ? 'on' : ''}>1 ค้นหา</li>
        <li className={preview ? 'on' : ''}>2 ตรวจรายการ</li>
        <li className={preview ? 'on' : ''}>3 ยืนยัน</li>
      </ol>

      <div className="rbd-body">
        <form
          className="rbd-sec"
          onSubmit={e => {
            e.preventDefault()
            void search()
          }}
        >
          <h4>ค้นหาใบรับ</h4>
          {unresolved && <p className="rbd-hint">OCR อ่านคีย์ไม่ได้ · อ่านจาก PDF ทางซ้ายแล้วพิมพ์</p>}
          <label htmlFor={`${uid}-tax`}>
            เลขผู้เสียภาษีผู้ขาย {!unresolved && clean(doc.stax) && <span className="rbd-tag">จาก OCR</span>}
          </label>
          <input id={`${uid}-tax`} ref={firstField} className="inp mono" value={tax} onChange={edit(setTax)} inputMode="numeric" autoComplete="off" />
          <label htmlFor={`${uid}-inv`}>
            เลขที่ใบแจ้งหนี้ <span className="rbd-req">*</span> {!unresolved && clean(doc.inv) && <span className="rbd-tag">จาก OCR</span>}
          </label>
          <input id={`${uid}-inv`} className="inp mono" value={inv} onChange={edit(setInv)} autoComplete="off" />
          <label htmlFor={`${uid}-po`}>PO (ใช้เมื่อไม่มีเลขผู้เสียภาษี · ใช้หาผู้ขาย)</label>
          <input id={`${uid}-po`} className="inp mono" value={po} onChange={edit(setPo)} autoComplete="off" />
          <div className="rbd-row-end">
            <button type="submit" className="btn btn-primary" disabled={!canSearch} aria-busy={searching}>
              <Icon name="search" size="sm" /> {searching ? 'กำลังค้นหา…' : 'ค้นหา'}
            </button>
          </div>
        </form>

        <div aria-live="polite">
          {error && (
            <div className="note d" role="alert">
              <Icon name="alert" />
              <div>{error}</div>
            </div>
          )}

          {preview && (
            <section className="rbd-sec">
              <h4>ใบรับที่พบ</h4>
              <dl className="rbd-kv">
                <dt>เลขที่ใบรับ</dt>
                <dd className="mono">{preview.receipt.receiveId}</dd>
                <dt>วันที่รับ</dt>
                <dd>{preview.receipt.receiptDate || '—'}</dd>
                <dt>ผู้ขาย</dt>
                <dd>
                  {preview.receipt.supplierName} <span className="mono muted">({preview.receipt.supplierTaxId})</span>
                  {preview.supplierFromPo && <span className="rbd-tag">หาจาก PO</span>}
                </dd>
                <dt>ผู้รับ</dt>
                <dd>{preview.receipt.receiverName || '—'}</dd>
                <dt>PO</dt>
                <dd className="mono">{preview.receipt.poNumbers.join(', ') || '—'}</dd>
              </dl>

              <div className="rbd-amt">
                <span>ยอดใบแจ้งหนี้</span>
                <b className="num">{money(preview.invoiceTotal)}</b>
                <span>ยอดใบรับ</span>
                <b className="num">{money(preview.receipt.total)}</b>
                <span>ส่วนต่าง</span>
                <b className={`num ${preview.amountDiff === 0 ? 'ok' : 'warn'}`}>
                  {preview.amountDiff === 0 ? '✓ ตรงกัน' : money(preview.amountDiff)}
                </b>
              </div>
              {preview.amountDiff !== 0 && (
                <div className="note w">
                  <Icon name="alert" />
                  <div>ยอดไม่ตรงกัน · ตรวจรายการด้านล่างก่อนยืนยัน (ระบบไม่ห้าม)</div>
                </div>
              )}
              {billedLines.length > 0 && (
                <div className="note w">
                  <Icon name="alert" />
                  <div>มี {billedLines.length} รายการที่วางบิลครบแล้วใน Oracle · ใบแจ้งหนี้นี้อาจถูกลงบัญชีไปแล้ว</div>
                </div>
              )}

              <div className="rbd-tbl-wrap">
                <table className="rbd-tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>PO</th>
                      <th>รหัส</th>
                      <th>รายการ</th>
                      <th className="num">จำนวนรับ</th>
                      <th className="num">ราคา/หน่วย</th>
                      <th className="num">รวม</th>
                      <th className="num">วางบิลแล้ว</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.receipt.lines.map((l, i) => {
                      const full = l.qtyBilled != null && l.qty > 0 && l.qtyBilled >= l.qty
                      return (
                        <tr key={`${l.rcvLineId}-${i}`} className={full ? 'billed' : undefined}>
                          <td>{l.lineNo || i + 1}</td>
                          <td className="mono">{l.poNumber || '—'}</td>
                          <td className="mono">{l.itemCode || '—'}</td>
                          <td>{l.itemDesc}</td>
                          <td className="num">
                            {Number(l.qty).toLocaleString()} {l.uom}
                          </td>
                          <td className="num">{money(l.unitPrice)}</td>
                          <td className="num">{money(l.lineAmount)}</td>
                          <td className="num">{l.qtyBilled != null ? Number(l.qtyBilled).toLocaleString() : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {preview && o && (
          <section className="rbd-sec">
            <h4>ผลที่จะเกิด</h4>
            {isDup ? (
              <div className="note d">
                <Icon name="copy" />
                <div>
                  ใบรับนี้ถูกใช้โดย <b>{o.duplicateOf?.id}</b> ({o.duplicateOf?.status}) แล้ว · เอกสารนี้จะเป็น <b>Duplicate</b> (Reject ได้อย่างเดียว)
                  <button type="button" className="rbd-link" onClick={() => o.duplicateOf && selectDoc(o.duplicateOf.id)}>
                    เปิด {o.duplicateOf?.id}
                  </button>
                </div>
              </div>
            ) : (
              <div className="note ok">
                <Icon name="checkc" />
                <div>
                  ผูกใบรับ และ <b>Confirm ทันที</b> → เข้าคิว AP Interface
                  {o.supersede.length > 0 && (
                    <>
                      <br />
                      เอกสาร {o.supersede.map(s => `${s.id} (${s.status})`).join(', ')} จะเป็น <b>Superseded</b>
                    </>
                  )}
                </div>
              </div>
            )}
            {!doc.receiver && preview.receipt.receiverName && (
              <p className="rbd-hint">ผู้รับ {preview.receipt.receiverName} จะเห็นเอกสารนี้เมื่อบัญชีถูกผูกกับ Oracle แล้วเท่านั้น</p>
            )}
            <label htmlFor={`${uid}-rs`}>
              เหตุผล <span className="rbd-req">*</span>
            </label>
            <textarea
              id={`${uid}-rs`}
              className="inp"
              rows={2}
              maxLength={500}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="เช่น ตรวจเอกสารและรายการรับด้วยตาแล้ว ตรงกัน"
            />
          </section>
        )}
      </div>

      <footer className="rbd-f">
        <button type="button" className="btn" onClick={onClose} disabled={binding}>
          ยกเลิก
        </button>
        <button
          type="button"
          className={`btn ${isDup ? 'btn-warn' : 'btn-success'}`}
          disabled={!preview || !reason.trim() || binding || searching}
          aria-busy={binding}
          title={!preview ? 'ค้นหาใบรับก่อน' : !reason.trim() ? 'ระบุเหตุผล' : undefined}
          onClick={() => void bind()}
        >
          <Icon name={isDup ? 'copy' : 'check'} size="sm" />
          {binding ? 'กำลังบันทึก…' : isDup ? 'ผูกและบันทึกเป็น Duplicate' : 'ผูกใบรับและ Confirm'}
        </button>
      </footer>
    </aside>
  )
}

export default ReceiptBindDrawer
