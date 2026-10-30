'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { InvoiceDoc, EvidenceSelection, type Finding, type RuleCheck } from '../../types/invoice'
import { EvidenceButton } from '../evidence/EvidenceButton'
import { findingsOf } from '../../features/evidence/findings'
import { useAuth } from '../../context/AuthContext'
import { useInvoices, TODAY } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'
import { COMPANIES, ORG_NAMES, buyerOrgOf } from '../../mock/companies'
import { RULES, EXCEPTION_CATALOG, EU_CODES, ActionType } from '../../mock/rules'
import { getValidationCategory } from '../../features/pdf-viewer/lib/validationCategories'
import { canBindReceipt } from '../../lib/docTransitions'
import { hasReceipt } from '../../lib/queueFilters'
import { ReceiptBindDrawer } from './ReceiptBindDrawer'

interface InvoiceDetailPaneProps {
  doc: InvoiceDoc
  onOpenActionModal: (act: ActionType) => void
  /**
   * v5.9 closed-documents page: no action bar at all (no Confirm / Reject / Hold / Review / upload
   * can render, so none can be clicked); the closing summary is shown in its place.
   */
  readOnly?: boolean
  /** Rendered instead of the action bar when `readOnly`. */
  closureSlot?: React.ReactNode
}

export function InvoiceDetailPane({ doc, onOpenActionModal, readOnly = false, closureSlot }: InvoiceDetailPaneProps) {
  const { currentUser, can, scopeCheck } = useAuth()
  const {
    activeDetailTab,
    setActiveDetailTab,
    isEvidenceDockOpen,
    openEvidenceDock,
    openEvidence,
    closeEvidenceDock,
    isPdfLoading,
    allowedAction,
    hasHighSeverity,
    isEuPending,
    evidenceSelection,
    setEvidenceSelection,
  } = useInvoices()
  const { toast } = useToastModal()

  const [selectedPoFilter, setSelectedPoFilter] = useState<string | null>(null)
  // Rule cards whose long finding list (> 5) the reviewer expanded. Declared before any early return.
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({})
  // v5.11 ผูกใบรับ
  const [bindOpen, setBindOpen] = useState(false)
  useEffect(() => {
    setSelectedPoFilter(null)
    setBindOpen(false)
  }, [doc.doc])
  // v5.14.1: buyer ORG shown in the metadata grid (master name by company code / ORG_ID)
  const buyer = buyerOrgOf(doc)
  const bindCheck = canBindReceipt({ status: doc.status, identityStatus: doc.identityStatus ?? null, hasReceipt: hasReceipt(doc) })

  // v5.11.1: the receipt drawer and the PDF dock occupy the same right-hand side — only one at a time.
  // Opening the drawer closes the dock; the dock opening (button, P key, an evidence chip …) closes
  // the drawer. Only the *transition* of the dock to open counts, so opening the drawer — which closes
  // the dock in the same event — never closes itself.
  const openBind = () => {
    if (isEvidenceDockOpen) closeEvidenceDock()
    setBindOpen(true)
  }
  const dockWasOpen = useRef(isEvidenceDockOpen)
  useEffect(() => {
    if (isEvidenceDockOpen && !dockWasOpen.current) setBindOpen(false)
    dockWasOpen.current = isEvidenceDockOpen
  }, [isEvidenceDockOpen])

  // A box picked on the evidence surface is mirrored here: the rule card or line
  // row it belongs to is marked and scrolled into view (bi-directional link).
  const detailRef = useRef<HTMLElement | null>(null)
  const appliedRef = useRef<EvidenceSelection | null>(null)
  useEffect(() => {
    if (!evidenceSelection || appliedRef.current === evidenceSelection) return
    appliedRef.current = evidenceSelection
    if (evidenceSelection.lineNo != null && activeDetailTab !== 'lines') setActiveDetailTab('lines')
    const frame = requestAnimationFrame(() => {
      detailRef.current
        ?.querySelector('[data-sel="1"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [evidenceSelection, activeDetailTab, setActiveDetailTab])


  const check = scopeCheck(doc)
  if (!check.ok) {
    return (
      <section className="col detail" id="detail" aria-label="รายละเอียดเอกสาร">
        <div className="empty" style={{ margin: 'auto' }}>
          <Icon name="lock" />
          {check.why}
        </div>
      </section>
    )
  }

  const calcAge = (upDate: string): number => {
    return Math.max(
      0,
      Math.round(
        (new Date(TODAY + 'T00:00:00Z').getTime() - new Date(upDate + 'T00:00:00Z').getTime()) / 864e5
      )
    )
  }

  const copyText = (txt: string, msg?: string) => {
    navigator.clipboard?.writeText(txt).catch(() => {})
    toast(msg || `คัดลอก ${txt} แล้ว`)
  }

  // 4 Steps Status Evaluation
  const stepRules: Record<number, string[]> = {
    1: ['V-01', 'V-02', 'V-03', 'V-06'],
    2: ['V-04', 'V-05'],
    3: ['V-07', 'V-08', 'V-09']
  }

  const evalStep = (stepNum: number) => {
    const rIds = stepRules[stepNum]
    const matched = doc.rules.filter(r => rIds.includes(r.rule || r.id))
    if (matched.every(r => r.status === 'SKIP' || r.result === 'not_evaluated')) {
      return { cls: 'skip', lbl: 'ไม่ได้ประเมิน', icon: 'pause' as const }
    }
    if (matched.some(r => (r.status === 'FAIL' || r.result === 'fail') && r.severity === 'High')) {
      return { cls: 'bad', lbl: 'พบ High', icon: 'x' as const }
    }
    if (matched.some(r => r.status === 'FAIL' || r.result === 'fail' || r.status === 'WARN' || r.result === 'manual_review')) {
      return { cls: 'warn', lbl: 'ต้องตรวจ', icon: 'alert' as const }
    }
    return { cls: 'ok', lbl: 'ผ่าน', icon: 'check' as const }
  }

  const st1 = evalStep(1)
  const st2 = evalStep(2)
  const st3 = evalStep(3)
  const stDup =
    doc.status === 'Duplicate'
      ? { cls: 'bad', lbl: 'พบซ้ำ', icon: 'x' as const }
      : { cls: 'ok', lbl: 'ไม่ซ้ำ', icon: 'check' as const }

  // Cards: failed rules first, then rules waiting for a person (manual_review). A manual_review rule
  // used to have no card at all, so its evidence (engine v5.7 review rows) had nowhere to be opened.
  const isFail = (r: RuleCheck) => r.status === 'FAIL' || r.result === 'fail'
  const isReview = (r: RuleCheck) => !isFail(r) && (r.status === 'WARN' || r.result === 'manual_review')
  const failRules = [...doc.rules.filter(isFail), ...doc.rules.filter(isReview)]
  const passRules = doc.rules.filter(r => r.status === 'PASS' || r.result === 'pass')
  /** `V-07` -> 'V-07 จับคู่รายบรรทัดและราคา' (exact code; the old `startsWith` matched 'V-0' too). */
  const ruleTitle = (r: RuleCheck) => RULES.find((x: string) => x.split(' ')[0] === r.rule) || r.name
  const FINDINGS_SHOWN = 5
  const activeFindingId = evidenceSelection?.findingId ?? null
  const openFinding = (f: Finding) => openEvidence(f)

  return (
    <section className="col detail" id="detail" aria-label="รายละเอียดเอกสาร" ref={detailRef}>
      <div className="scroll" id="dbody">
        {/* Document Header */}
        <div className="dh">
          <div className="dh-top">
            <div className="dh-title">
              <h1>{doc.inv}</h1>
              <StatusBadge status={doc.status} />
              <span className="pill fit" title={`${doc.company} · ${COMPANIES[doc.company]?.name ?? ''}`}>
                <Icon name="building" size="sm" />
                {doc.company} · {COMPANIES[doc.company]?.name}
              </span>
              <span className="pill">รอบตรวจ #{doc.round || 1}</span>
              <span className="pill">
                <Icon name="user" size="sm" />
                {doc.assigned === 'eu' ? 'รอผู้ใช้งาน' : 'ฝ่ายบัญชี'}
              </span>
            </div>

            <div className="dh-act">
              <button
                type="button"
                className="btn btn-sec sm"
                onClick={() => copyText(doc.inv)}
                title="คัดลอกเลขที่ใบแจ้งหนี้"
              >
                <Icon name="copy" size="sm" />
                คัดลอก
              </button>

              <a
                href={`/viewer/${doc.doc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sec sm"
                title="เปิดตัวตรวจ BBox เต็มหน้าจอในแท็บใหม่"
                data-testid="open-standalone-viewer"
              >
                <Icon name="ext" size="sm" />
                ตรวจ BBox (แท็บใหม่)
              </a>

              <button
                type="button"
                className={`btn ${isEvidenceDockOpen ? 'btn-close-pdf' : 'btn-sec'} sm`}
                onClick={() => {
                  if (isPdfLoading || isEvidenceDockOpen) closeEvidenceDock()
                  else openEvidenceDock(1)
                }}
                disabled={!can('DMS')}
                title={
                  isPdfLoading
                    ? 'ยกเลิกการโหลด (P / Esc)'
                    : isEvidenceDockOpen
                      ? 'ปิด PDF (P / Esc)'
                      : 'เปิดเอกสาร PDF (P)'
                }
              >
                {isPdfLoading ? (
                  <>
                    <span className="spin" aria-hidden="true" />
                    กำลังโหลด…
                  </>
                ) : (
                  <>
                    <Icon name={isEvidenceDockOpen ? 'x' : 'file'} size="sm" />
                    {isEvidenceDockOpen ? 'ปิด PDF' : 'เปิดเอกสาร PDF'} <kbd>P</kbd>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="meta">
            <div>
              <div className="m-l">ผู้ขาย</div>
              <div className="m-v" title={doc.vendor}>{doc.vendor}</div>
              <div className="m-h" title={`Tax ID ${doc.stax}`}>Tax ID {doc.stax}</div>
            </div>
            <div>
              {/* v5.14.1: บริษัทผู้ซื้อ (Buyer ORG) จาก master "บริษัทและ ORG_ID" — ไม่ใช่ชื่อผู้ขายใน Oracle */}
              <div className="m-l">บริษัทผู้ซื้อ (Buyer ORG)</div>
              <div className="m-v" title={buyer.name || undefined}>{buyer.name || '—'}</div>
              <div className="m-h">
                {buyer.source === 'master' ? buyer.code : buyer.source === 'invoice' ? 'ตามใบแจ้งหนี้' : 'ยังไม่ทราบบริษัท'}
              </div>
            </div>
            <div>
              <div className="m-l">
                PO <span className="tag-ro">ไม่ตรวจ</span>
              </div>
              <div className="m-v mono" title={doc.po || undefined}>{doc.po}</div>
              <div className="m-h">Release {doc.release ?? '—'}</div>
            </div>
            <div>
              <div className="m-l">ใบรับ</div>
              <div className="m-v mono" title={doc.rcv || undefined}>{doc.rcv || '—'}</div>
            </div>
            <div>
              <div className="m-l">ORG_ID</div>
              <div className="m-v" title={doc.org ? `${doc.org} ${ORG_NAMES[doc.org] || ''}`.trim() : undefined}>
                {doc.org ? `${doc.org} ${ORG_NAMES[doc.org] || ''}` : '—'}
              </div>
              <div className="m-h">{doc.org ? '' : 'ยังไม่เรียก Oracle'}</div>
            </div>
            <div>
              <div className="m-l">Receiver</div>
              <div className="m-v mono" title={doc.receiver || undefined}>
                {doc.receiver ? (
                  doc.receiver
                ) : (
                  <span className="pre-x">ไม่มี</span>
                )}
              </div>
              <div className="m-h">
                {doc.receiver && !doc.receiverActive ? 'ยังไม่เชื่อมบัญชี' : ''}
              </div>
            </div>
            <div>
              <div className="m-l">วันที่ใบแจ้งหนี้</div>
              <div className="m-v">{doc.dt}</div>
              <div className="m-h" title={`${doc.doc} · ${doc.pages} หน้า`}>{doc.doc} · {doc.pages} หน้า</div>
            </div>
            <div>
              <div className="m-l">วันที่เข้าระบบ</div>
              <div className="m-v">{doc.up}</div>
              <div className="m-h">อายุ {calcAge(doc.up)} วัน</div>
            </div>
            <div>
              <div className="m-l">ยอดรวมสุทธิ</div>
              <div className="m-v big mono">
                {doc.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
              </div>
              <div className="m-h">
                ก่อนภาษี {(doc.sub || Math.round(doc.total / 1.07)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* 4 Steps Indicator */}
          <div className="steps">
            <div className={`step ${st1.cls}`}>
              <span className="dot"><Icon name={st1.icon} /></span>
              <div>
                <div className="t">STEP 1 สกัดและตรวจเอกสาร</div>
                <div className="s">{st1.lbl}</div>
              </div>
            </div>
            <div className={`step ${st2.cls}`}>
              <span className="dot"><Icon name={st2.icon} /></span>
              <div>
                <div className="t">STEP 2 ค้นใบรับและลูกค้า</div>
                <div className="s">{st2.lbl}</div>
              </div>
            </div>
            <div className={`step ${st3.cls}`}>
              <span className="dot"><Icon name={st3.icon} /></span>
              <div>
                <div className="t">STEP 3 เทียบกับใบรับ</div>
                <div className="s">{st3.lbl}</div>
              </div>
            </div>
            <div className={`step ${stDup.cls}`}>
              <span className="dot"><Icon name={stDup.icon} /></span>
              <div>
                <div className="t">Portal ตรวจซ้ำ</div>
                <div className="s">{stDup.lbl}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="tabs" role="tablist">
          {[
            { k: 'sum', label: 'สรุปผล', count: failRules.length, cc: failRules.length ? 'r' : '' },
            { k: 'lines', label: 'รายบรรทัด', count: doc.lines?.length || 0 },
            { k: 'receipts', label: 'ใบรับ Oracle', count: doc.oracleReceiptLines?.length || 0 },
            { k: 'rules', label: 'กฎ 9 ข้อ', count: `${passRules.length}/9` },
            { k: 'own', label: 'ผู้รับผิดชอบและสิทธิ์' },
            { k: 'json', label: 'JSON' },
            { k: 'log', label: 'ประวัติ', count: doc.history.length }
          ].map(tab => (
            <button
              key={tab.k}
              type="button"
              className={`tab ${activeDetailTab === tab.k ? 'on' : ''}`}
              role="tab"
              aria-selected={activeDetailTab === tab.k}
              onClick={() => setActiveDetailTab(tab.k)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`c ${tab.cc || ''}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="pane">
          {activeDetailTab === 'sum' && (
            <div>
              {doc.tc && (
                <div className="note i" style={{ marginBottom: 10 }}>
                  <Icon name="info" />
                  <div><b>เคสทดสอบ (mock):</b> {doc.tc}</div>
                </div>
              )}
              {doc.supersededBy && (
                <div className="note d" style={{ marginBottom: 10 }}>
                  <Icon name="layers" />
                  <div>
                    <b>ถูกแทนที่ (Superseded)</b> โดย {doc.supersededBy} · {doc.supRule || ''}
                  </div>
                </div>
              )}
              {doc.supersedes && (
                <div className="note i" style={{ marginBottom: 10 }}>
                  <Icon name="layers" />
                  <div>ฉบับนี้แทนที่ {doc.supersedes} · {doc.supRule || ''}</div>
                </div>
              )}
              {doc.duplicate_of && (
                <div className="note d" style={{ marginBottom: 10 }}>
                  <Icon name="copy" />
                  <div>
                    <b>Duplicate</b> ของ {doc.duplicate_of} · {doc.dupRule || ''}
                  </div>
                </div>
              )}

              <div className="sec-h">
                <h3>ข้อยกเว้นจาก AIVA ({failRules.length})</h3>
                <p>มาตรฐาน v6.10 · schema 1.7</p>
              </div>

              {failRules.length > 0 ? (
                failRules.map((r, rIdx) => {
                  const review = isReview(r)
                  // A review card has no exception code; it must not borrow E01 from the old default.
                  const c = r.exception_code || (review ? '' : 'E01')
                  const cat = (c && EXCEPTION_CATALOG[c]) || (review ? ['ต้องตรวจโดยคน', 'acc'] : ['ข้อยกเว้น', 'acc'])
                  const isEuAction = cat[1] === 'eu'
                  const sev = r.severity || (review ? 'Low' : 'High')
                  const catKey = getValidationCategory(c || null, r.rule)
                  const findings = findingsOf(r, doc)
                  const expanded = !!expandedRules[r.rule]
                  const shown = expanded ? findings : findings.slice(0, FINDINGS_SHOWN)

                  const picked = evidenceSelection?.ruleId === r.rule

                  // Clicking the card = the button of its first finding. A card with no finding (a
                  // manual_review the Engine gave no evidence row) only marks itself: no dock, no page 1.
                  const handleSelectValidation = () => {
                    const ruleId = r.rule || r.id
                    if (findings[0]) {
                      openFinding(findings[0])
                      return
                    }
                    setEvidenceSelection({ ruleId, exceptionCode: r.exception_code, surface: 'pdf' })
                  }

                  return (
                    <div
                      // id/rule can repeat (one rule, several exceptions) → index keeps keys unique
                      key={`${r.id || r.rule}-${rIdx}`}
                      data-rule={r.rule}
                      data-sel={picked ? '1' : undefined}
                      className={`exc ${sev}${picked ? ' is-active sel' : ''} cat-${catKey}`}
                      onClick={handleSelectValidation}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSelectValidation()
                        }
                      }}
                    >
                      <div className="exc-h">
                        <span className={`code ${sev}${review ? ' review' : ''}`}>{c || 'ต้องตรวจ'}</span>
                        <h4>{cat[0]}</h4>
                        {!review && <span className={`sev ${sev}`}>{sev}</span>}
                        <span className="sp" />
                        <span className={`owner-tag ${isEuAction ? 'eu' : ''}`}>
                          <Icon name={isEuAction ? 'user' : 'building'} size="sm" />
                          {isEuAction ? 'ผู้ใช้งานแก้' : 'ฝ่ายบัญชีตัดสิน'}
                        </span>
                      </div>
                      <div className="rl">{ruleTitle(r)}</div>
                      <div className="ev">
                        <div className="ev-text">
                          {findings.length > 1
                            ? `${r.detail || r.evidence || ''}${r.detail || r.evidence ? '\n' : ''}พบ ${findings.length} รายการ`
                            : findings[0]?.messageTh || r.detail || r.evidence || ''}
                        </div>
                        {can('DMS') && findings.length === 1 && (
                          <div className="ev-btn">
                            <EvidenceButton
                              finding={findings[0]}
                              onOpen={openFinding}
                              active={activeFindingId === findings[0].id}
                            />
                          </div>
                        )}
                      </div>
                      {findings.length > 1 && (
                        <ul className="fnd-list" aria-label={`หลักฐานของ ${r.rule}`}>
                          {shown.map((f, fIdx) => (
                            <li
                              key={`${f.id}-${fIdx}`}
                              className={`fnd${activeFindingId === f.id ? ' on' : ''}`}
                              data-finding={f.id}
                            >
                              <span className={`code ${f.severity ?? 'Low'}${f.code ? '' : ' review'}`}>
                                {f.code ?? 'ต้องตรวจ'}
                              </span>
                              <span className="fnd-text">{f.messageTh || r.detail || f.ruleId}</span>
                              {can('DMS') && (
                                <EvidenceButton
                                  finding={f}
                                  onOpen={openFinding}
                                  active={activeFindingId === f.id}
                                  compact
                                />
                              )}
                            </li>
                          ))}
                          {findings.length > FINDINGS_SHOWN && (
                            <li className="fnd-more">
                              <button
                                type="button"
                                className="link"
                                onClick={e => {
                                  e.stopPropagation()
                                  setExpandedRules(prev => ({ ...prev, [r.rule]: !expanded }))
                                }}
                              >
                                {expanded ? 'ย่อรายการ' : `แสดงอีก ${findings.length - FINDINGS_SHOWN} รายการ`}
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="note ok">
                  <Icon name="checkc" />
                  <div>
                    <b>ไม่พบรหัสข้อผิดพลาดจาก AIVA</b>
                    <br />
                    เอกสารผ่านกฎ 9 ข้อตามมาตรฐาน v6.10
                  </div>
                </div>
              )}

              {!doc.receiver && (
                <div className="note w">
                  <Icon name="user" />
                  <div>
                    ไม่มี Receiver เพราะยังไม่พบใบรับ · ผู้ใช้งานมองไม่เห็นเอกสารนี้ ·{' '}
                    {bindCheck.ok ? 'ตรวจเอกสารแล้วใช้ "ผูกใบรับ" เพื่อ Confirm หรือ Reject' : 'ทำได้เฉพาะ Reject'}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeDetailTab === 'lines' && (
            <div>
              <div className="note i" style={{ marginBottom: 12 }}>
                <Icon name="info" />
                <div>
                  ค้นใบรับด้วย Tax ID ผู้ขาย <b className="mono">{doc.stax}</b> + Invoice <b>{doc.inv}</b> · PO {doc.po} แสดงผลเท่านั้น
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>รายการ</th>
                      <th className="num">จำนวน</th>
                      <th>หน่วย</th>
                      <th className="num">ราคา</th>
                      <th className="num">ราคารวม</th>
                      <th>บรรทัดใบรับ</th>
                      <th className="num">จำนวนรับ</th>
                      <th className="num">ราคาใบรับ</th>
                      <th>ชั้น</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(doc.lines || []).map((l, i) => {
                      const nq = l.po_line == null
                      const bad = !nq && (l.po_qty !== l.qty || l.po_price !== l.price)
                      const picked = evidenceSelection?.lineNo === i + 1
                      return (
                        <tr
                          key={i}
                          data-line={i + 1}
                          data-sel={picked ? '1' : undefined}
                          className={`${bad ? 'row-bad' : ''}${picked ? ' row-sel' : ''}`}
                        >
                          <td>{i + 1}</td>
                          <td>{l.desc}</td>
                          <td className="num">{l.qty}</td>
                          <td>{l.unit}</td>
                          <td className="num">{l.price.toLocaleString()}</td>
                          <td className="num">{l.amount.toLocaleString()}</td>
                          <td>{nq ? <span className="nac">—</span> : l.po_line}</td>
                          <td className="num">{nq ? 'ไม่ได้ประเมิน' : l.po_qty}</td>
                          <td className="num">{nq ? '—' : l.po_price?.toLocaleString()}</td>
                          <td>{l.match_level || 'M1'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeDetailTab === 'receipts' && (
            <div data-testid="oracle-receipts-pane">
              {(!doc.oracleReceiptLines || doc.oracleReceiptLines.length === 0) ? (
                <div className="note i">
                  <Icon name="info" />
                  <div>
                    <b>ไม่พบรายการรับใน Oracle</b>
                    <br />
                    เอกสารฉบับนี้ยังไม่มีข้อมูลรายการรับในระบบ Oracle Snapshot
                  </div>
                </div>
              ) : (
                (() => {
                  const rcvLines = doc.oracleReceiptLines
                  const uniquePos = Array.from(new Set(rcvLines.map(l => l.poNumber).filter(Boolean)))
                  const totalReceiptAmount = rcvLines.reduce((s, l) => s + (l.lineAmount || 0), 0)
                  const subtotal = doc.sub || 0
                  const diff = Math.round((subtotal - totalReceiptAmount) * 100) / 100
                  const displayedLines = selectedPoFilter
                    ? rcvLines.filter(l => l.poNumber === selectedPoFilter)
                    : rcvLines

                  return (
                    <div>
                      <div className="note i" style={{ marginBottom: 12 }}>
                        <Icon name="info" />
                        <div>
                          <div>
                            พบรายการรับ <b>{rcvLines.length}</b> รายการ · อ้างอิง{' '}
                            <b>{uniquePos.length}</b> PO:{' '}
                            {uniquePos.map(po => (
                              <span key={`${po}`} className="pill mono po-pill" style={{ marginLeft: 4 }}>
                                PO {po}
                              </span>
                            ))}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-muted, #666)' }}>
                            ยอดรวมใบรับ:{' '}
                            <b>
                              {totalReceiptAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </b>{' '}
                            บาท (ยอด Invoice ก่อนภาษี:{' '}
                            {subtotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            บาท
                            {diff !== 0
                              ? ` · ผลต่าง: ${diff.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} บาท`
                              : ' · ยอดตรงกัน'}
                            {doc.receiver ? ` · ผู้รับ: ${doc.receiver}` : ''})
                          </div>
                        </div>
                      </div>

                      {uniquePos.length > 0 && (
                        <div className="po-chips" style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={`btn btn-sec sm ${!selectedPoFilter ? 'active' : ''}`}
                            onClick={() => setSelectedPoFilter(null)}
                          >
                            ทั้งหมด ({rcvLines.length})
                          </button>
                          {uniquePos.map(po => {
                            const count = rcvLines.filter(l => l.poNumber === po).length
                            return (
                              <button
                                key={po}
                                type="button"
                                className={`btn btn-sec sm ${selectedPoFilter === po ? 'active' : ''}`}
                                onClick={() => setSelectedPoFilter(selectedPoFilter === po ? null : po)}
                              >
                                PO {po} ({count})
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <div className="tbl-wrap">
                        <table className="t">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>PO #</th>
                              <th>เลขที่ใบรับ</th>
                              <th>รหัสสินค้า</th>
                              <th>รายการ</th>
                              <th className="num">จำนวนรับ</th>
                              <th className="num">ราคา/หน่วย</th>
                              <th className="num">ราคารวม</th>
                              <th className="num">วางบิลแล้ว</th>
                              <th>สถานะ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedLines.map((l, idx) => (
                              <tr key={`${l.rcvLineId ?? ''}-${idx}`} data-rcv-line={l.lineNo || idx + 1}>
                                <td>{l.lineNo || idx + 1}</td>
                                <td>
                                  <span className="pill mono po-pill">{l.poNumber || '—'}</span>
                                </td>
                                <td className="mono">{l.rcvLineId || `${l.receiptNum}-${l.lineNo}`}</td>
                                <td className="mono">{l.itemCode || '—'}</td>
                                <td>{l.itemDesc}</td>
                                <td className="num">
                                  {l.qty.toLocaleString()} {l.uom}
                                </td>
                                <td className="num">
                                  {l.unitPrice.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="num">
                                  {l.lineAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="num">{l.qtyBilled != null ? l.qtyBilled.toLocaleString() : '—'}</td>
                                <td>
                                  <span className={`pill ${l.lineStatus === 'FULLY RECEIVED' ? 'ok' : 'info'}`}>
                                    {l.lineStatus || l.poLineStatus || 'RECEIVED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          )}

          {activeDetailTab === 'rules' && (
            <div className="tbl-wrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>กฎ</th>
                    <th>ผล</th>
                    <th>Exception code</th>
                    <th>หลักฐาน</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {doc.rules.map((r, rIdx) => {
                    const passed = r.status === 'PASS' || r.status === 'SKIP'
                    const findings = passed ? [] : findingsOf(r, doc)
                    return (
                    <tr
                      key={`${r.id || r.rule}-${rIdx}`}
                      className={r.status === 'FAIL' || r.result === 'fail' ? 'row-bad' : ''}
                    >
                      <td>{ruleTitle(r)}</td>
                      <td className={r.status === 'PASS' || r.result === 'pass' ? 'okc' : 'badc'}>
                        {r.status || r.result}
                      </td>
                      <td>
                        {r.exception_code ? (
                          <span className={`code ${r.severity || 'High'}`}>
                            {r.exception_code}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="sm">{r.detail || r.evidence || ''}</td>
                      <td>
                        {can('DMS') && findings.length === 1 && (
                          <EvidenceButton
                            finding={findings[0]}
                            onOpen={openFinding}
                            active={activeFindingId === findings[0].id}
                            compact
                          />
                        )}
                        {can('DMS') && findings.length > 1 && (
                          <button
                            type="button"
                            className="link"
                            title="ดูรายการหลักฐานทั้งหมดของกฎนี้"
                            onClick={() => {
                              setActiveDetailTab('sum')
                              setEvidenceSelection({ ruleId: r.rule, exceptionCode: r.exception_code, surface: 'pdf' })
                            }}
                          >
                            <Icon name="target" size="sm" /> {findings.length} รายการ
                          </button>
                        )}
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeDetailTab === 'own' && (
            <div className="grid2">
              <div className="card">
                <h4>ผู้รับผิดชอบเอกสาร</h4>
                <div className="kv">
                  <span>บริษัท</span>
                  <b>{doc.company} · {COMPANIES[doc.company]?.name}</b>
                </div>
                <div className="kv">
                  <span>Receiver</span>
                  <b className="mono">{doc.receiver || '— ไม่มี'}</b>
                </div>
                <div className="kv">
                  <span>ผู้สแกนเข้า DMS</span>
                  <b className="mono">{doc.upl || '—'}</b>
                </div>
              </div>
            </div>
          )}

          {activeDetailTab === 'json' && (
            <div>
              <div className="sec-h">
                <p>JSON ตามมาตรฐาน v6.10 ตารางที่ 9 (schema 1.7)</p>
                <button
                  type="button"
                  className="btn btn-sec sm"
                  onClick={() => copyText(JSON.stringify(doc, null, 2), 'คัดลอก JSON แล้ว')}
                >
                  <Icon name="copy" size="sm" /> คัดลอก JSON
                </button>
              </div>
              <pre className="json">{JSON.stringify(doc, null, 2)}</pre>
            </div>
          )}

          {activeDetailTab === 'log' && (
            <div className="tl">
              {doc.history.map((h, idx) => (
                <div key={idx} className={`tle ${h.k || 'h'}`}>
                  <div className="t">{h.dt} {h.t}</div>
                  <div className="a">{h.act}</div>
                  <div>{h.d}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {readOnly ? (
          closureSlot ?? null
        ) : (
        <>
        {/* Action Bar */}
        <div className="abar">
          {currentUser.role === 'EU' ? (
            <>
              <div className="hint">
                <Icon name={doc.assigned === 'eu' ? 'alert' : 'info'} />
                <span>
                  {doc.assigned === 'eu'
                    ? `ต้องแก้: ${doc.codes.filter(c => EU_CODES.has(c)).join(', ')} · แก้ไขแล้วอัปโหลดเอกสารใหม่`
                    : 'เอกสารอยู่ที่ฝ่ายบัญชี · ดูได้อย่างเดียว'}
                </span>
              </div>
              {allowedAction(doc, 'upload').ok && (
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={() => onOpenActionModal('upload')}
                >
                  <Icon name="dl" size="sm" />
                  อัปโหลดเอกสารใหม่
                </button>
              )}
            </>
          ) : (
            <>
              <div className="hint">
                <Icon name={hasHighSeverity(doc) ? 'alert' : 'checkc'} />
                <span>
                  {hasHighSeverity(doc)
                    ? 'พบรหัส High · Confirm ต้องมีหมายเหตุ'
                    : isEuPending(doc)
                    ? `มีรหัสที่ ${doc.receiver} ต้องแก้ค้าง · Confirm แทนได้ (ต้องระบุเหตุผล)`
                    : doc.receiver && !doc.receiverActive
                    ? `${doc.receiver} ยังไม่ผูก Oracle account · Confirm ได้ (ต้องระบุเหตุผล)`
                    : 'พร้อมดำเนินการ'}
                </span>
              </div>
              {bindCheck.ok && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={bindOpen}
                  title="ค้นหาใบรับด้วยเลขผู้เสียภาษี / PO + เลขที่ใบแจ้งหนี้ แล้ว Confirm"
                  onClick={openBind}
                >
                  <Icon name="search" size="sm" /> ผูกใบรับ
                </button>
              )}
              <button
                type="button"
                className="btn btn-danger"
                disabled={!allowedAction(doc, 'reject').ok}
                title={allowedAction(doc, 'reject').why}
                onClick={() => onOpenActionModal('reject')}
              >
                <Icon name="ban" size="sm" /> Reject
              </button>
              <button
                type="button"
                className="btn btn-warn"
                disabled={!allowedAction(doc, 'hold').ok}
                title={allowedAction(doc, 'hold').why}
                onClick={() => onOpenActionModal('hold')}
              >
                <Icon name="pause" size="sm" /> Hold
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={!allowedAction(doc, 'confirm').ok}
                title={allowedAction(doc, 'confirm').why}
                onClick={() => onOpenActionModal('confirm')}
              >
                <Icon name="check" size="sm" /> Confirm
              </button>
            </>
          )}
        </div>
        </>
        )}
      </div>
      {bindOpen && !readOnly && <ReceiptBindDrawer doc={doc} onClose={() => setBindOpen(false)} />}
    </section>
  )
}

export default InvoiceDetailPane
