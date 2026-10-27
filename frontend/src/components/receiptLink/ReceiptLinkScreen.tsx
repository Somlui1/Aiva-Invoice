'use client'

/**
 * v5.11 Phase 1 — "ผูกใบรับ" screen (opened from the document detail pane; ACC / APR / SA).
 *
 *   left   PDF, every page in one vertical scroll (LinkPdfPane)
 *   right  ① ใบรับ  ② ข้อมูลเอกสาร  ③ เทียบใบรับ  ④ เหตุผล   — flat sections, no card in card
 *   bottom sticky bar: ปฏิเสธ · Hold รอใบรับ · บันทึก · Confirm (or ปิดเป็นเอกสารซ้ำ)
 *          + what is still missing, always shown under Confirm
 *
 * The server is the judge: every form change is re-evaluated by POST …/link/evaluate (debounced),
 * the receipt is looked up only when the user presses "ค้น". "View as" = every control locked.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { LinkPdfPane, type PaneBox } from './LinkPdfPane'
import { CONFIRM_REASONS, type LinkInput, type ReceiptLine } from '../../lib/receiptLink'
import { rowLocateWhy } from '../../lib/approxLineMatch'
import { PREVIEW_BLOCK_REASON } from '../../lib/viewAs'
import { evaluateLink, fetchLinkContext, isFail, writeLink, type LinkContext, type LinkOp } from '../../lib/receiptLinkApi'
import type { InvoiceDoc, InvoiceLineItem } from '../../types/invoice'

interface Props {
  docId: string
  onClose: () => void
  /** Called with the updated document after a successful write. */
  onDone: (doc: InvoiceDoc | null, message: string) => void
  onOpenDoc?: (docId: string) => void
}

interface Form {
  receiptInput: string
  /** Receipt the user asked to look up ('' = the engine's / saved one). */
  receiptNum: string
  reasonCode: string
  reasonText: string
  note: string
  invoiceNum: string
  invoiceNumConfirm: string
  grandTotal: string
  grandTotalConfirm: string
  acceptReceiptCompany: boolean
  acceptReceiptSupplier: boolean
}

const EMPTY: Form = {
  receiptInput: '',
  receiptNum: '',
  reasonCode: '',
  reasonText: '',
  note: '',
  invoiceNum: '',
  invoiceNumConfirm: '',
  grandTotal: '',
  grandTotalConfirm: '',
  acceptReceiptCompany: false,
  acceptReceiptSupplier: false,
}

const money = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const FIELD_BOXES = ['invoice_num', 'supplier_tax_id', 'sub_total', 'vat', 'grand_total'] as const
const FIELD_TH: Record<string, string> = {
  invoice_num: 'เลขใบแจ้งหนี้',
  supplier_tax_id: 'Tax ID ผู้ขาย',
  sub_total: 'ยอดก่อน VAT',
  vat: 'VAT',
  grand_total: 'ยอดรวม',
}

function toInput(f: Form): LinkInput {
  return {
    receiptNum: f.receiptNum || null,
    reasonCode: f.reasonCode || null,
    reasonText: f.reasonText || null,
    note: f.note || null,
    manual: { invoiceNum: f.invoiceNum, invoiceNumConfirm: f.invoiceNumConfirm, grandTotal: f.grandTotal, grandTotalConfirm: f.grandTotalConfirm },
    acceptReceiptCompany: f.acceptReceiptCompany,
    acceptReceiptSupplier: f.acceptReceiptSupplier,
  }
}

export function ReceiptLinkScreen({ docId, onClose, onDone, onOpenDoc }: Props) {
  const { isPreview } = useAuth()
  const [ctx, setCtx] = useState<LinkContext | null>(null)
  const [doc, setDoc] = useState<InvoiceDoc | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [evaluating, setEvaluating] = useState(false)
  const [busy, setBusy] = useState<LinkOp | null>(null)
  const [stale, setStale] = useState(false)
  const [actionErr, setActionErr] = useState<string | null>(null)
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [activeBox, setActiveBox] = useState<string | null>(null)
  const [scrollTo, setScrollTo] = useState<{ id: string; nonce: number } | null>(null)
  const [reload, setReload] = useState(0)
  /** Input the current `ctx` was evaluated with (JSON) — the effect skips identical input. */
  const baseline = useRef('')
  const evalSeq = useRef(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  /** "ลองใหม่" after Oracle was down: evaluate the same input again. */
  const forceEval = useRef(false)

  const locked = isPreview || stale || busy !== null

  // ---- load ----------------------------------------------------------------------------------
  useEffect(() => {
    let alive = true
    setCtx(null)
    setLoadErr(null)
    setStale(false)
    setForm(EMPTY)
    baseline.current = JSON.stringify(toInput(EMPTY))
    void fetchLinkContext(docId).then(r => {
      if (!alive) return
      if (isFail(r)) return setLoadErr(r.error)
      setCtx(r)
      setDoc(r.document ?? null)
      const inv = r.manualValues.find(m => m.field === 'invoiceNum')
      const tot = r.manualValues.find(m => m.field === 'grandTotal')
      const next: Form = {
        ...EMPTY,
        ...(r.savedLink?.manual ? { receiptInput: r.savedLink.receiptNum, receiptNum: r.savedLink.receiptNum } : {}),
        ...(inv ? { invoiceNum: String(inv.value), invoiceNumConfirm: String(inv.value) } : {}),
        ...(tot ? { grandTotal: String(tot.value), grandTotalConfirm: String(tot.value) } : {}),
      }
      // what the server just evaluated — no need to ask again until the form differs
      baseline.current = JSON.stringify(toInput(next))
      setForm(next)
    })
    return () => {
      alive = false
    }
  }, [docId, reload])

  // ---- re-evaluate on change (debounced) -----------------------------------------------------
  const input = useMemo(() => toInput(form), [form])
  useEffect(() => {
    if (!ctx) return
    const key = JSON.stringify(input)
    if (key === baseline.current && !forceEval.current) return
    forceEval.current = false
    baseline.current = key
    const seq = ++evalSeq.current
    setEvaluating(true)
    const t = setTimeout(() => {
      void evaluateLink(docId, input).then(r => {
        if (seq !== evalSeq.current) return
        setEvaluating(false)
        if (isFail(r)) return setActionErr(r.error)
        setActionErr(null)
        // keep the version the screen was OPENED with: a newer server version = someone else wrote
        const { version: serverVersion, ...rest } = r
        setCtx(prev => (prev ? { ...prev, ...rest, document: prev.document } : r))
        if (prev409(serverVersion, ctx.version)) setStale(true)
      })
    }, 350)
    return () => clearTimeout(t)
  }, [input]) // eslint-disable-line react-hooks/exhaustive-deps

  // Esc closes (unless a write is running)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))

  // ---- derived ------------------------------------------------------------------------------
  const ev = ctx?.evaluation
  const lookup = ctx?.lookup
  const receipt = lookup?.state === 'found' ? lookup.receipt : null
  const lookingUp = evaluating && !!form.receiptNum && form.receiptNum !== (receipt?.receiptNum ?? '')
  const boxes = doc?.bboxes ?? []
  const boxById = useMemo(() => new Map(boxes.map(b => [b.id, b])), [boxes])
  const lines: InvoiceLineItem[] = doc?.lines ?? []
  const diffs = ev?.lineDiffs ?? []
  const pairs = ctx?.pairs ?? []

  const fieldBox = (name: string) => boxes.find(b => b.fieldName === name && b.elementType === 'field')

  const paneBoxes: PaneBox[] = useMemo(() => {
    const out: PaneBox[] = []
    for (const l of lines) {
      const b = l.element_id ? boxById.get(l.element_id) : undefined
      if (!b) continue
      const isDiff = diffs.some(d => d.invNo === l.no)
      out.push({ id: b.id, pageNo: b.pageNo, bbox: b.bbox, tone: isDiff ? 'diff' : 'row', label: `บรรทัด ${l.no}` })
    }
    for (const f of FIELD_BOXES) {
      const b = boxes.find(x => x.fieldName === f && x.elementType === 'field')
      if (b) out.push({ id: b.id, pageNo: b.pageNo, bbox: b.bbox, tone: f === 'sub_total' && ev?.amountDiff ? 'diff' : 'field', label: FIELD_TH[f] })
    }
    return out
  }, [lines, boxes, boxById, diffs, ev?.amountDiff])

  const goToBox = useCallback((id: string | undefined) => {
    if (!id) return
    setActiveBox(id)
    setScrollTo({ id, nonce: Date.now() })
  }, [])

  const onRowClick = (l: InvoiceLineItem) => {
    setActiveRow(l.no)
    const b = l.element_id ? boxById.get(l.element_id) : undefined
    if (b) goToBox(b.id)
    else setActiveBox(null)
  }

  const onBoxClick = (id: string) => {
    setActiveBox(id)
    const l = lines.find(x => x.element_id === id)
    if (l) {
      setActiveRow(l.no)
      rootRef.current?.querySelector(`[data-inv-row="${l.no}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }

  // ---- write --------------------------------------------------------------------------------
  const run = async (op: LinkOp) => {
    if (!ctx || locked) return
    setBusy(op)
    setActionErr(null)
    const r = await writeLink(docId, op, ctx.version, input)
    setBusy(null)
    if (isFail(r)) {
      if (r.status === 409 && r.code === 'STALE') setStale(true)
      else if (r.code === 'DUPLICATE_IN_AP' && r.evaluation) setCtx(c => (c ? { ...c, evaluation: r.evaluation! } : c))
      setActionErr(r.error)
      return
    }
    onDone(r.document, r.message)
    if (op === 'save') {
      setReload(n => n + 1)
    } else onClose()
  }

  // ---- render -------------------------------------------------------------------------------
  const missing = ev?.missing ?? []
  const dupOf = ev?.duplicateOf ?? null
  const holdOk = !!doc && ['Auto-pass', 'Review', 'Manual Review', 'Hold'].includes(doc.status)
  const rejectOk = form.note.trim().length >= 3
  const confirmReady = !!ev?.canConfirm && !evaluating
  const lockWhy = isPreview ? PREVIEW_BLOCK_REASON : stale ? 'เอกสารถูกแก้ไขแล้ว · โหลดหน้าใหม่' : undefined

  return (
    <div className="rl-root" role="dialog" aria-modal="true" aria-labelledby="rl-title" tabIndex={-1} ref={rootRef}>
      <header className="rl-head">
        <div className="rl-title">
          <Icon name="link" />
          <h2 id="rl-title">ผูกใบรับ</h2>
          <span className="mono">{docId}</span>
          {doc && <StatusBadge status={doc.status} />}
          {doc?.identityStatus === 'UNRESOLVED' && <span className="rl-tag warn">UNRESOLVED</span>}
          {doc?.company === '?' && <span className="rl-tag warn">ไม่รู้บริษัท</span>}
          {(doc?.manualValues?.length ?? 0) > 0 && <span className="rl-tag info">มีค่าที่คนกรอก</span>}
        </div>
        <button type="button" className="btn btn-ghost sm" onClick={onClose} disabled={busy !== null} aria-label="ปิดหน้าผูกใบรับ (Esc)">
          <Icon name="x" size="sm" /> ปิด
        </button>
      </header>

      {isPreview && (
        <div className="rl-banner info" role="status">
          <Icon name="lock" size="sm" /> {PREVIEW_BLOCK_REASON} · ทุกปุ่มถูกล็อก (เซิร์ฟเวอร์ตอบ PREVIEW_READ_ONLY)
        </div>
      )}
      {stale && (
        <div className="rl-banner err" role="alert">
          <Icon name="alert" size="sm" /> เอกสารถูกแก้ไขหลังจากเปิดหน้านี้ (409) · ค่าที่กรอกยังไม่ถูกบันทึก
          <button type="button" className="btn btn-sec sm" onClick={() => setReload(n => n + 1)}>
            <Icon name="refresh" size="sm" /> โหลดหน้าใหม่
          </button>
        </div>
      )}

      {loadErr ? (
        <div className="rl-load err" role="alert">
          <Icon name="alert" /> {loadErr}
          <button type="button" className="btn btn-sec sm" onClick={() => setReload(n => n + 1)}>ลองใหม่</button>
        </div>
      ) : !ctx ? (
        <div className="rl-load" role="status">
          <span className="rl-spin" aria-hidden /> กำลังโหลดเอกสาร…
        </div>
      ) : (
        <div className="rl-body">
          <LinkPdfPane documentId={docId} boxes={paneBoxes} activeId={activeBox} scrollTo={scrollTo} onBoxClick={onBoxClick} />

          <div className="rl-side">
            {/* ① ใบรับ ------------------------------------------------------------------ */}
            <section className="rl-sec" aria-labelledby="rl-s1">
              <h3 id="rl-s1"><span className="rl-step">1</span> ใบรับ</h3>
              <form
                className="rl-row"
                onSubmit={e => {
                  e.preventDefault()
                  set('receiptNum', form.receiptInput.trim().toUpperCase())
                }}
              >
                <label className="rl-fld grow">
                  <span>เลขใบรับ (Oracle)</span>
                  <input
                    className="inp mono"
                    value={form.receiptInput}
                    onChange={e => set('receiptInput', e.target.value)}
                    placeholder={ctx.evaluation.effective.receiptNum ?? 'เช่น 50220043288'}
                    disabled={locked}
                    maxLength={30}
                    autoComplete="off"
                  />
                </label>
                <button type="submit" className="btn btn-primary" disabled={locked || !form.receiptInput.trim()}>
                  <Icon name="search" size="sm" /> ค้น
                </button>
              </form>
              <ReceiptStatus
                ctx={ctx}
                lookingUp={lookingUp}
                onRetry={() => {
                  forceEval.current = true
                  setForm(f => ({ ...f }))
                }}
              />
              {receipt && (
                <dl className="rl-kv">
                  <dt>บริษัท (ORG_ID)</dt><dd>{receipt.companyCode} · {receipt.orgId ?? '—'} {receipt.ouName ? `· ${receipt.ouName}` : ''}</dd>
                  <dt>ผู้ขาย</dt><dd>{receipt.supplierName ?? '—'} <span className="mono">{receipt.supplierTaxId ?? ''}</span></dd>
                  <dt>Receiver</dt><dd>{receipt.receiver ?? '—'}</dd>
                  <dt>ยอดรับ (ก่อน VAT)</dt><dd className="mono">{money(receipt.total)}</dd>
                  <dt>ยอดสะสมที่ใช้แล้ว</dt>
                  <dd className="mono">
                    {money(ev?.receiptUsedTotal ?? 0)}
                    {(ev?.receiptUsedBy.length ?? 0) > 0 && (
                      <span className="rl-refs">
                        {' '}· {ev!.receiptUsedBy.map(id => <DocLink key={id} id={id} onOpen={onOpenDoc} />)}
                      </span>
                    )}
                  </dd>
                </dl>
              )}
              {receipt && doc?.company === '?' && receipt.companyCode !== '?' && (
                <label className="rl-check">
                  <input type="checkbox" checked={form.acceptReceiptCompany} onChange={e => set('acceptReceiptCompany', e.target.checked)} disabled={locked} />
                  <span>ใช้บริษัทจากใบรับ: <b>{receipt.companyCode}</b> (ORG_ID {receipt.orgId ?? '—'})</span>
                </label>
              )}
              {receipt && !doc?.stax && receipt.supplierTaxId && (
                <label className="rl-check">
                  <input type="checkbox" checked={form.acceptReceiptSupplier} onChange={e => set('acceptReceiptSupplier', e.target.checked)} disabled={locked} />
                  <span>ใช้ผู้ขายจากใบรับ: <b>{receipt.supplierName}</b> <span className="mono">{receipt.supplierTaxId}</span></span>
                </label>
              )}
            </section>

            {/* ② ข้อมูลเอกสาร -------------------------------------------------------------- */}
            <section className="rl-sec" aria-labelledby="rl-s2">
              <h3 id="rl-s2"><span className="rl-step">2</span> ข้อมูลเอกสาร</h3>
              <dl className="rl-kv">
                <dt>บริษัท</dt><dd>{ev?.effective.companyFromReceipt ? <>{ev.effective.companyCode} <span className="rl-tag info">จากใบรับ</span></> : doc?.company ?? '—'}</dd>
                <dt>ผู้ขาย</dt><dd>{ev?.effective.supplierName || '—'} <span className="mono">{ev?.effective.supplierTaxId}</span></dd>
                <dt>เลขใบแจ้งหนี้</dt>
                <dd>
                  <FieldValue value={ev?.requireManualInvoiceNum ? null : doc?.inv} box={fieldBox('invoice_num')} onGo={goToBox} />
                </dd>
                <dt>ยอดรวม (OCR)</dt>
                <dd>
                  <FieldValue value={ev?.requireManualTotal ? null : money(doc?.total)} box={fieldBox('grand_total')} onGo={goToBox} mono />
                </dd>
              </dl>
              {ev?.requireManualInvoiceNum && (
                <div className="rl-twice">
                  <p className="rl-hint"><Icon name="info" size="sm" /> OCR อ่านเลขใบแจ้งหนี้ไม่ได้ · กรอก 2 ครั้งให้ตรงกัน</p>
                  <div className="rl-row">
                    <label className="rl-fld grow"><span>เลขใบแจ้งหนี้</span><input className="inp mono" value={form.invoiceNum} onChange={e => set('invoiceNum', e.target.value)} disabled={locked} maxLength={60} autoComplete="off" /></label>
                    <label className="rl-fld grow"><span>พิมพ์อีกครั้ง</span><input className={`inp mono${form.invoiceNumConfirm && form.invoiceNumConfirm.trim() !== form.invoiceNum.trim() ? ' bad' : ''}`} value={form.invoiceNumConfirm} onChange={e => set('invoiceNumConfirm', e.target.value)} onPaste={e => e.preventDefault()} disabled={locked} maxLength={60} autoComplete="off" /></label>
                  </div>
                </div>
              )}
              {ev?.requireManualTotal && (
                <div className="rl-twice">
                  <p className="rl-hint"><Icon name="info" size="sm" /> OCR อ่านยอดรวมไม่ได้ · กรอกจากใบแจ้งหนี้ 2 ครั้ง (ไม่ใช้ยอดใบรับแทน)</p>
                  <div className="rl-row">
                    <label className="rl-fld grow"><span>ยอดรวม (รวม VAT)</span><input className="inp mono" inputMode="decimal" value={form.grandTotal} onChange={e => set('grandTotal', e.target.value)} disabled={locked} maxLength={20} autoComplete="off" /></label>
                    <label className="rl-fld grow"><span>พิมพ์อีกครั้ง</span><input className={`inp mono${form.grandTotalConfirm && form.grandTotalConfirm.replace(/,/g, '') !== form.grandTotal.replace(/,/g, '') ? ' bad' : ''}`} inputMode="decimal" value={form.grandTotalConfirm} onChange={e => set('grandTotalConfirm', e.target.value)} onPaste={e => e.preventDefault()} disabled={locked} maxLength={20} autoComplete="off" /></label>
                  </div>
                </div>
              )}
            </section>

            {/* ③ เทียบใบรับ ---------------------------------------------------------------- */}
            <section className="rl-sec" aria-labelledby="rl-s3">
              <h3 id="rl-s3"><span className="rl-step">3</span> เทียบใบรับ</h3>
              {!receipt ? (
                <p className="rl-muted">ยังไม่มีใบรับให้เทียบ</p>
              ) : (
                <>
                  <div className="rl-table-wrap">
                    <table className="rl-table">
                      <thead>
                        <tr>
                          <th>#</th><th>รายการ (ใบแจ้งหนี้)</th><th className="num">จำนวน</th><th className="num">ราคา</th><th className="num">ยอด</th><th>ใบรับ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map(l => {
                          const p = pairs.find(x => x.invNo === l.no)
                          const r = p ? receipt.lines.find(x => x.rcvLineId === p.rcvLineId) : undefined
                          const has = (f: 'qty' | 'price' | 'amount') => diffs.some(d => d.invNo === l.no && d.field === f)
                          const box = l.element_id ? boxById.get(l.element_id) : undefined
                          const why = rowLocateWhy({ elementId: l.element_id, pageNo: l.page_no }, !!box)
                          return (
                            <tr
                              key={l.no}
                              data-inv-row={l.no}
                              className={`${activeRow === l.no ? 'on' : ''}${box ? ' locatable' : ' nobox'}`}
                              onClick={() => onRowClick(l)}
                              title={why || 'กดเพื่อเลื่อน PDF ไปที่บรรทัดนี้'}
                            >
                              <td className="mono">{l.no}</td>
                              <td className="desc">
                                {l.desc}
                                {r && <div className="rl-sub">↳ {r.itemDesc}</div>}
                              </td>
                              <td className={`num mono${has('qty') ? ' diff' : ''}`}>{l.qty}{r && has('qty') && <div className="rl-sub">{r.qty}</div>}</td>
                              <td className={`num mono${has('price') ? ' diff' : ''}`}>{money(l.price)}{r && has('price') && <div className="rl-sub">{money(r.unitPrice)}</div>}</td>
                              <td className={`num mono${has('amount') ? ' diff' : ''}`}>{money(l.amount)}{r && has('amount') && <div className="rl-sub">{money(r.lineAmount)}</div>}</td>
                              <td className="mono xs">
                                {r ? (
                                  <>
                                    L{r.lineNo} {p!.approx ? <span className="rl-tag warn" title="จับคู่แบบประมาณโดย portal · ใช้นำทางเท่านั้น ไม่ใช้ตัดสิน">ประมาณ</span> : <span className="rl-tag ok" title="จับคู่โดย engine">engine</span>}
                                  </>
                                ) : (
                                  <span className="rl-muted" title="ไม่พบคู่ที่แน่นอน · ไม่เดา">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                        {unpaired(receipt.lines, pairs).map(r => (
                          <tr key={r.rcvLineId} className="rcv-only">
                            <td className="mono">—</td>
                            <td className="desc"><span className="rl-tag">เฉพาะใบรับ</span> {r.itemDesc}</td>
                            <td className="num mono">{r.qty}</td>
                            <td className="num mono">{money(r.unitPrice)}</td>
                            <td className="num mono">{money(r.lineAmount)}</td>
                            <td className="mono xs">L{r.lineNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <dl className="rl-kv totals">
                    <dt><FieldLink name="sub_total" box={fieldBox('sub_total')} onGo={goToBox} /></dt>
                    <dd className={`mono${ev?.amountDiff ? ' diff' : ''}`}>{money(ev?.effective.compareAmount)} <span className="rl-muted">· ใบรับ {money(receipt.total)}</span>{ev?.amountDiff ? <b> ({ev.amountDiff > 0 ? '+' : ''}{money(ev.amountDiff)})</b> : null}</dd>
                    <dt><FieldLink name="vat" box={fieldBox('vat')} onGo={goToBox} /></dt><dd className="mono">{money(doc?.vat)}</dd>
                    <dt><FieldLink name="grand_total" box={fieldBox('grand_total')} onGo={goToBox} /></dt><dd className="mono">{money(ev?.effective.grandTotal)}</dd>
                  </dl>
                </>
              )}
            </section>

            {/* ④ เหตุผล ---------------------------------------------------------------------- */}
            <section className="rl-sec" aria-labelledby="rl-s4">
              <h3 id="rl-s4"><span className="rl-step">4</span> เหตุผล</h3>
              <Gates ctx={ctx} onOpenDoc={onOpenDoc} />
              <fieldset className="rl-reasons" disabled={locked}>
                <legend>เหตุผลที่ Confirm {ev?.requireReason ? <em className="req">จำเป็น</em> : <span className="rl-muted">(ไม่บังคับ · Auto-pass)</span>}</legend>
                {CONFIRM_REASONS.map(r => (
                  <label key={r.code} className={`rl-radio${form.reasonCode === r.code ? ' on' : ''}`}>
                    <input type="radio" name="rl-reason" value={r.code} checked={form.reasonCode === r.code} onChange={() => set('reasonCode', r.code)} />
                    <span>{r.th}</span>
                  </label>
                ))}
              </fieldset>
              {form.reasonCode === 'OTHER' && (
                <label className="rl-fld"><span>ระบุเหตุผล</span><input className="inp" value={form.reasonText} onChange={e => set('reasonText', e.target.value)} disabled={locked} maxLength={500} /></label>
              )}
              <label className="rl-fld">
                <span>หมายเหตุ {ev?.requireNote ? <em className="req">จำเป็น</em> : null} <span className="rl-muted">(ใช้เป็นเหตุผลเมื่อกดปฏิเสธ)</span></span>
                <textarea className="inp" rows={3} value={form.note} onChange={e => set('note', e.target.value)} disabled={locked} maxLength={1000} />
              </label>
            </section>
          </div>
        </div>
      )}

      {/* sticky action bar --------------------------------------------------------------------- */}
      <footer className="rl-bar">
        <div className="rl-bar-msg" aria-live="polite">
          {actionErr && <span className="err"><Icon name="alert" size="sm" /> {actionErr}</span>}
        </div>
        <div className="rl-bar-btns">
          <button type="button" className="btn btn-danger" disabled={locked || !ctx || !rejectOk} title={lockWhy ?? (rejectOk ? 'ปฏิเสธเอกสาร' : 'พิมพ์เหตุผลในช่องหมายเหตุก่อน')} onClick={() => void run('reject')}>
            <Icon name="ban" size="sm" /> {busy === 'reject' ? 'กำลังปฏิเสธ…' : 'ปฏิเสธ'}
          </button>
          <button type="button" className="btn btn-warn" disabled={locked || !ctx || !holdOk} title={lockWhy ?? (holdOk ? 'พักเอกสารไว้จนกว่าใบรับจะเข้า Oracle' : 'สถานะนี้ Hold ไม่ได้')} onClick={() => void run('hold')}>
            <Icon name="pause" size="sm" /> {busy === 'hold' ? 'กำลัง Hold…' : 'Hold รอใบรับ'}
          </button>
          <button type="button" className="btn btn-sec" disabled={locked || !ctx} title={lockWhy ?? 'บันทึกใบรับ / ค่าที่กรอก โดยยังไม่ Confirm'} onClick={() => void run('save')}>
            <Icon name="check" size="sm" /> {busy === 'save' ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
          <div className="rl-confirm">
            {dupOf ? (
              <button type="button" className="btn btn-danger" disabled={locked} title={lockWhy ?? `ปิดเอกสารนี้เป็นเอกสารซ้ำของ ${dupOf}`} onClick={() => void run('close_duplicate')}>
                <Icon name="copy" size="sm" /> {busy === 'close_duplicate' ? 'กำลังปิด…' : 'ปิดเป็นเอกสารซ้ำ'}
              </button>
            ) : (
              <button type="button" className="btn btn-success" disabled={locked || !confirmReady} title={lockWhy ?? (confirmReady ? 'Confirm เอกสาร' : `ยังขาด: ${missing.join(' · ')}`)} onClick={() => void run('confirm')}>
                <Icon name="check" size="sm" /> {busy === 'confirm' ? 'กำลัง Confirm…' : 'Confirm'}
              </button>
            )}
            <div className={`rl-missing${confirmReady && !dupOf ? ' ok' : ''}`} aria-live="polite">
              {isPreview
                ? 'โหมดดูในมุมมอง · ทำรายการไม่ได้'
                : !ctx
                  ? '…'
                  : evaluating
                    ? 'กำลังตรวจเงื่อนไข…'
                    : dupOf
                      ? `ซ้ำกับ ${dupOf} ที่อยู่ใน AP แล้ว`
                      : confirmReady
                        ? 'พร้อม Confirm'
                        : `ยังขาด: ${missing.join(' · ') || '—'}`}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/** A different server version than the one opened → someone else wrote. */
function prev409(serverVersion: string | undefined, opened: string): boolean {
  return !!serverVersion && serverVersion !== opened
}

function unpaired(rcv: ReceiptLine[], pairs: Array<{ rcvLineId: string }>): ReceiptLine[] {
  const used = new Set(pairs.map(p => p.rcvLineId))
  return rcv.filter(r => !used.has(r.rcvLineId))
}

function DocLink({ id, onOpen }: { id: string; onOpen?: (id: string) => void }) {
  if (!onOpen) return <span className="mono">{id} </span>
  return (
    <button type="button" className="rl-link mono" onClick={() => onOpen(id)} title={`เปิด ${id}`}>
      {id}
    </button>
  )
}

function FieldValue({ value, box, onGo, mono }: { value: string | null | undefined; box?: { id: string }; onGo: (id: string) => void; mono?: boolean }) {
  if (value === null || value === undefined || value === '' || value === '—') return <span className="rl-tag warn">OCR อ่านไม่ได้</span>
  if (!box) return <span className={mono ? 'mono' : ''} title="ไม่มีตำแหน่งบนเอกสาร">{value}</span>
  return (
    <button type="button" className={`rl-link${mono ? ' mono' : ''}`} onClick={() => onGo(box.id)} title="เลื่อน PDF ไปที่ค่านี้">
      {value} <Icon name="target" size="sm" />
    </button>
  )
}

function FieldLink({ name, box, onGo }: { name: string; box?: { id: string }; onGo: (id: string) => void }) {
  if (!box) return <span title="OCR ไม่ได้ส่งกรอบของค่านี้ · ไม่มีตำแหน่งบนเอกสาร">{FIELD_TH[name]}</span>
  return (
    <button type="button" className="rl-link" onClick={() => onGo(box.id)} title="เลื่อน PDF ไปที่ค่านี้">
      {FIELD_TH[name]} <Icon name="target" size="sm" />
    </button>
  )
}

function ReceiptStatus({ ctx, lookingUp, onRetry }: { ctx: LinkContext; lookingUp: boolean; onRetry: () => void }) {
  const l = ctx.lookup
  if (lookingUp) return <p className="rl-state" role="status"><span className="rl-spin" aria-hidden /> กำลังค้นใบรับใน Oracle…</p>
  switch (l.state) {
    case 'found':
      return (
        <p className="rl-state ok">
          <Icon name="checkc" size="sm" /> ใบรับ <b className="mono">{l.receipt.receiptNum}</b> · {l.source === 'engine' ? 'จาก engine' : 'ค้นจาก Oracle'}
          {ctx.evaluation.receiptManual && <span className="rl-tag info">กรอกเอง</span>}
        </p>
      )
    case 'not_found':
      return <p className="rl-state err"><Icon name="alert" size="sm" /> ไม่พบใบรับ <b className="mono">{l.receiptNum}</b> ใน Oracle · Confirm ไม่ได้ ให้ Hold รอใบรับ</p>
    case 'out_of_scope':
      return <p className="rl-state err"><Icon name="lock" size="sm" /> ใบรับอยู่บริษัท {l.companyCode} ซึ่งไม่ได้รับมอบหมาย</p>
    case 'unavailable':
      return (
        <p className="rl-state err" role="alert">
          <Icon name="alert" size="sm" /> Oracle ไม่พร้อม: {l.error}
          <button type="button" className="btn btn-sec sm" onClick={onRetry}><Icon name="refresh" size="sm" /> ลองใหม่</button>
        </p>
      )
    case 'none':
      return <p className="rl-state">เอกสารนี้ยังไม่มีใบรับ · กรอกเลขใบรับแล้วกด ค้น</p>
    default:
      return null
  }
}

function Gates({ ctx, onOpenDoc }: { ctx: LinkContext; onOpenDoc?: (id: string) => void }) {
  const gates = ctx.evaluation.gates.filter(g => !g.key.startsWith('rcv_') || g.key.startsWith('rcv_used_'))
  if (!gates.length) return null
  return (
    <ul className="rl-gates">
      {gates.map(g => (
        <li key={g.key} className={g.level}>
          <Icon name={g.level === 'block' ? 'ban' : g.level === 'warn' ? 'alert' : 'info'} size="sm" />
          <span>{g.msg}</span>
          {g.ref && <DocLink id={g.ref} onOpen={onOpenDoc} />}
        </li>
      ))}
    </ul>
  )
}

export default ReceiptLinkScreen
