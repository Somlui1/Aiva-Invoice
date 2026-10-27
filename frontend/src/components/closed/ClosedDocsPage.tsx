'use client'

/**
 * v5.9 — "เอกสารที่ปิดแล้ว" (design B: one menu, group tabs inside the page).
 *
 * Same building blocks as the review queue (company chips · DateRangeTool · SmartSearchBox · table /
 * split · detail pane · PDF dock), but read-only:
 *  - group tabs AP Flow / ปฏิเสธ / เอกสารซ้ำ with status chips inside a group;
 *  - date filter defaults to "วันที่ปิดงาน";
 *  - columns: ปิดโดย · วันที่ปิด · เหตุผล / อ้างอิง (batch, AP id, replacing / original document);
 *  - the detail pane is rendered with `readOnly` → no action bar exists; a closing summary replaces it;
 *  - all filters are local to this page, so the review queue's filters are never touched.
 *
 * Bug guards: the selected document is dropped (and the PDF closed) when it leaves the filtered
 * list; switching to the table closes the PDF; tab / chip state is validated against the role.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../common/Icon'
import { FilterChip } from '../common/FilterChip'
import { InvoiceDetailPane } from '../queue/InvoiceDetailPane'
import { QueueListItem } from '../queue/QueueListItem'
import { SmartSearchBox } from '../queue/SmartSearchBox'
import { DateRangeTool } from '../queue/DateRangeTool'
import { EvidenceViewerDock } from '../evidence/EvidenceViewerDock'
import { ClosedStatusBadge } from './ClosedStatusBadge'
import { useInvoices, inPerDoc, type PeriodFilter } from '../../context/InvoiceContext'
import { useAuth } from '../../context/AuthContext'
import { useToastModal } from '../../context/ToastModalContext'
import { COMPANIES } from '../../mock/companies'
import { matchesSearchQuery } from '../../lib/queueFilters'
import {
  CLOSED_GROUPS,
  CLOSED_STATUS_META,
  closedDocsCsv,
  closureOf,
  downloadCsv,
  SENT_STALE_DAYS,
  closedGroupsFor,
  closedVisibleFor,
  groupOf,
  isSentStale,
  sentAgeDays,
  sortClosed,
  type ClosedGroup,
  type ClosedStatus,
} from '../../lib/closedDocs'
import type { InvoiceDoc } from '../../types/invoice'

const dmy = (iso: string) => (iso && iso.length >= 10 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—')
const money = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'

export function ClosedDocsPage() {
  const { currentUser, realUser, isPreview } = useAuth()
  const { visibleDocs, isEvidenceDockOpen, closeEvidenceDock, dockSplitRatio, closedFocus } = useInvoices()
  const { toast } = useToastModal()

  const role = currentUser.role
  const isEu = role === 'EU'
  /** v5.10: EU = "ผลการส่งเอกสาร" (ส่งจ่ายแล้ว · ถูกปฏิเสธ · ถูกแทนที่); others = closed work. */
  const groupDefs = useMemo(() => closedGroupsFor(role), [role])
  const allowedGroups = useMemo(() => groupDefs.map(g => g.key), [groupDefs])
  /** Real SA, not previewing: internal columns are available. */
  const canInternals = realUser.role === 'SA' && !isPreview
  const [internals, setInternals] = useState(false)
  const warnStaleSent = role === 'APR' || role === 'SA'
  const [group, setGroup] = useState<ClosedGroup>('ap')
  const [sub, setSub] = useState<ClosedStatus | 'all'>('all')
  const [companies, setCompanies] = useState<Set<string>>(new Set())
  const [period, setPeriod] = useState<PeriodFilter>({ k: 'all', field: 'closed' })
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'table' | 'split'>('table')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const railRef = useRef<HTMLButtonElement>(null)

  // A role change (or a stale tab) can never leave the page on a group the user may not see.
  useEffect(() => {
    if (!allowedGroups.includes(group)) {
      setGroup(allowedGroups[0] ?? 'ap')
      setSub('all')
    }
  }, [allowedGroups, group])

  /** Every closed document the user may see in this page (scope already applied by context). */
  const closedDocs = useMemo(
    () => visibleDocs.filter(d => closedVisibleFor(d.status, role)),
    [visibleDocs, role],
  )

  /** Company + date + search — the base the tab counts are computed from. */
  const pool = useMemo(
    () =>
      closedDocs
        .filter(d => companies.size === 0 || companies.has(d.company))
        .filter(d => inPerDoc(d, period))
        .filter(d => matchesSearchQuery(d, query)),
    [closedDocs, companies, period, query],
  )

  const countBy = useMemo(() => {
    const m: Record<string, number> = {}
    for (const d of pool) m[d.status] = (m[d.status] ?? 0) + 1
    return m
  }, [pool])

  const groupDef = groupDefs.find(g => g.key === group) ?? groupDefs[0] ?? CLOSED_GROUPS[0]
  const groupCount = (g: ClosedGroup) =>
    (groupDefs.find(x => x.key === g)?.statuses ?? []).reduce((n, s) => n + (countBy[s] ?? 0), 0)
  const staleSent = useMemo(() => (warnStaleSent ? pool.filter(d => isSentStale(d)) : []), [pool, warnStaleSent])

  const rows = useMemo(
    () =>
      sortClosed(
        pool.filter(d =>
          sub === 'all' ? (groupDef.statuses as readonly string[]).includes(d.status) : d.status === sub,
        ),
      ),
    [pool, groupDef, sub],
  )

  const selected = useMemo(() => rows.find(d => d.doc === selectedId) ?? null, [rows, selectedId])
  const dockVisible = view === 'split' && isEvidenceDockOpen && !!selected

  // Guards: selection that left the list is dropped; the PDF never outlives its document or view.
  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null)
  }, [selectedId, selected])
  useEffect(() => {
    if (isEvidenceDockOpen && (view !== 'split' || !selected)) closeEvidenceDock()
  }, [isEvidenceDockOpen, view, selected, closeEvidenceDock])

  const pickGroup = (g: ClosedGroup) => {
    setGroup(g)
    setSub('all')
  }

  const open = (id: string) => {
    setSelectedId(id)
    setView('split')
  }

  /** Jump to a referenced document (replacement / original). */
  const goToDoc = useCallback(
    (id: string) => {
      const target = closedDocs.find(d => d.doc === id)
      if (!target) {
        const inQueue = visibleDocs.some(d => d.doc === id)
        toast(inQueue ? `${id} ยังไม่ปิด · ดูได้ที่หน้าคิวตรวจสอบ` : `ไม่พบ ${id} ในขอบเขตสิทธิ์ของคุณ`)
        return
      }
      const g = groupOf(target.status, role)!
      setGroup(g)
      setSub('all')
      setCompanies(new Set())
      setPeriod(p => ({ k: 'all', field: p.field }))
      setQuery('')
      setSelectedId(id)
      setView('split')
    },
    [closedDocs, visibleDocs, toast, role],
  )

  // Ctrl K / links from other pages: open that document here (once per request).
  const handledFocus = useRef(0)
  useEffect(() => {
    if (!closedFocus || closedFocus.nonce === handledFocus.current) return
    handledFocus.current = closedFocus.nonce
    goToDoc(closedFocus.id)
  }, [closedFocus, goToDoc])

  const resetFilters = () => {
    setCompanies(new Set())
    setPeriod(p => ({ k: 'all', field: p.field }))
    setQuery('')
    setSub('all')
  }
  const filtersActive = companies.size > 0 || period.k !== 'all' || query.trim() !== '' || sub !== 'all'

  const exportCsv = () => {
    if (rows.length === 0) {
      toast('ไม่มีรายการให้ส่งออก', true)
      return
    }
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const ok = downloadCsv(`aiva-closed-${group}${sub === 'all' ? '' : `-${sub}`}-${stamp}.csv`, closedDocsCsv(rows))
    toast(ok ? `ส่งออก ${rows.length} รายการแล้ว` : 'เบราว์เซอร์นี้ส่งออกไฟล์ไม่ได้', !ok)
  }

  const toggleCompany = (c: string) =>
    setCompanies(prev => {
      const n = new Set(prev)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })

  const companyCodes = currentUser.co.length ? currentUser.co : Object.keys(COMPANIES)

  return (
    <div className="pg cdp" data-pg="closed">
      {/* Toolbar — same tools as the queue, local to this page */}
      <div className="tbar">
        <span className="lab">ขอบเขตบริษัท</span>
        <FilterChip label="ทุกบริษัท" count={closedDocs.length} active={companies.size === 0} onClick={() => setCompanies(new Set())} />
        {companyCodes.map(c => (
          <FilterChip
            key={c}
            label={c}
            count={closedDocs.filter(d => d.company === c).length}
            active={companies.has(c)}
            onClick={() => toggleCompany(c)}
            title={COMPANIES[c]?.name}
          />
        ))}
        <span className="vsep" />
        <span className="lab">ช่วงเวลา</span>
        <DateRangeTool value={period} onChange={setPeriod} docs={closedDocs} fields={['closed', 'updated', 'invoice']} />
        {filtersActive && (
          <button type="button" className="chip" onClick={resetFilters}>
            <Icon name="x" size="sm" />
            ล้างตัวกรอง
          </button>
        )}
        <span className="grow" />
        {canInternals && view === 'table' && (
          <button
            type="button"
            className={`chip${internals ? ' on' : ''}`}
            aria-pressed={internals}
            title="Super Admin: แสดง identityStatus · assigned · DR · Batch / AP ID"
            onClick={() => setInternals(v => !v)}
          >
            <Icon name="code" size="sm" />
            ข้อมูลภายใน
          </button>
        )}
        {!isEu && (
          <button
            type="button"
            className="btn btn-sec sm"
            onClick={exportCsv}
            disabled={rows.length === 0 || isPreview}
            title={isPreview ? 'โหมดดูในมุมมอง · ทำรายการไม่ได้' : 'ส่งออกรายการที่แสดงอยู่เป็น CSV (เปิดใน Excel ได้)'}
          >
            <Icon name="dl" size="sm" />
            Export CSV
          </button>
        )}
        <div className="seg" role="group" aria-label="มุมมอง">
          <button type="button" className={view === 'split' ? 'on' : ''} aria-pressed={view === 'split'} onClick={() => setView('split')}>
            <Icon name="split" size="sm" />
            แยก 2 ฝั่ง
          </button>
          <button type="button" className={view === 'table' ? 'on' : ''} aria-pressed={view === 'table'} onClick={() => setView('table')}>
            <Icon name="table" size="sm" />
            ตาราง
          </button>
        </div>
      </div>

      {/* Group tabs + status chips (replace the queue's KPI cards) */}
      <div className="cdp-groups">
        <div className="cdp-tabs" role="tablist" aria-label="กลุ่มเอกสารที่ปิดแล้ว">
          {groupDefs.map(g => (
            <button
              key={g.key}
              type="button"
              role="tab"
              id={`cdp-tab-${g.key}`}
              aria-selected={group === g.key}
              aria-controls="cdp-panel"
              className={`cdp-tab cdp-tab-${g.key}${group === g.key ? ' on' : ''}`}
              title={g.hint}
              onClick={() => pickGroup(g.key)}
            >
              <span className="cdp-tab-l">{g.label}</span>
              <span className="cdp-tab-n">{groupCount(g.key)}</span>
              <span className="cdp-tab-h">{g.hint}</span>
            </button>
          ))}
        </div>
        {groupDef.statuses.length > 1 && (
          <div className="cdp-subs" role="group" aria-label={`สถานะใน ${groupDef.label}`}>
            <button type="button" className={`cdp-sub${sub === 'all' ? ' on' : ''}`} aria-pressed={sub === 'all'} onClick={() => setSub('all')}>
              ทั้งหมด <span className="n">{groupCount(group)}</span>
            </button>
            {groupDef.statuses.map((s, i) => (
              <span key={s} className="cdp-step">
                {group === 'ap' && i > 0 && <Icon name="chevR" size="sm" className="cdp-arrow" />}
                <button
                  type="button"
                  className={`cdp-sub${sub === s ? ' on' : ''}`}
                  aria-pressed={sub === s}
                  title={CLOSED_STATUS_META[s].desc}
                  onClick={() => setSub(sub === s ? 'all' : s)}
                >
                  <ClosedStatusBadge status={s} lang="th" />
                  <span className="n">{countBy[s] ?? 0}</span>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {staleSent.length > 0 && (
        <div className="cdp-stale" role="alert">
          <Icon name="alert" size="sm" />
          <span>
            มี <b>{staleSent.length}</b> รายการสถานะ <b>กำลังนำส่ง</b> ค้างเกิน {SENT_STALE_DAYS} วัน · ตรวจสถานะ AP Batch / Oracle Interface
          </span>
          <button
            type="button"
            className="link"
            onClick={() => {
              setGroup('ap')
              setSub('Sent')
              setView('table')
            }}
          >
            ดูรายการ
          </button>
        </div>
      )}

      <div id="cdp-panel" role="tabpanel" aria-labelledby={`cdp-tab-${group}`} className="cdp-body">
        {view === 'table' ? (
          <div className="tview">
            <div className="panel">
              <div className="panel-h">
                <h3>{groupDef.label}</h3>
                <span className="muted sm">{rows.length} ฉบับ</span>
                <span className="grow" />
                <div className="tsrch">
                  <SmartSearchBox id="cdq-t" variant="table" value={query} onChange={setQuery} placeholder="ค้นหา: เลขที่ · ผู้ขาย · Batch · เหตุผล · วันที่ · ยอดเงิน" />
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="t cdp-t">
                  <thead>
                    <tr>
                      <th>เลขที่ใบแจ้งหนี้</th>
                      <th>บริษัท</th>
                      <th>ผู้ขาย</th>
                      <th className="num">ยอดรวม</th>
                      <th>สถานะ</th>
                      <th>ปิดโดย</th>
                      <th>วันที่ปิด</th>
                      <th>{isEu ? 'ขั้นตอน / เหตุผล' : 'เหตุผล / อ้างอิง'}</th>
                      {internals && canInternals && (
                        <>
                          <th title="identityStatus">identity</th>
                          <th title="assigned lane">lane</th>
                          <th>DR</th>
                          <th>Batch / AP</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? (
                      rows.map(d => (
                        <ClosedRow
                          key={d.doc}
                          d={d}
                          onOpen={open}
                          onRef={goToDoc}
                          forEu={isEu}
                          internals={internals && canInternals}
                          stale={warnStaleSent && isSentStale(d)}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={internals && canInternals ? 12 : 8}>
                          <div className="empty">
                            <Icon name="inbox" />
                            ไม่มีเอกสารที่ปิดแล้วในกลุ่มและตัวกรองนี้
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`work${dockVisible ? ' pdf-open q-hide' : ''}`}
            id="work"
            style={
              {
                '--rc': dockVisible ? 'var(--q-rail-w, 36px)' : '0px',
                '--qc': dockVisible ? '0px' : 'var(--q-w)',
                '--mc': dockVisible ? `${((1 - dockSplitRatio) * 100).toFixed(1)}fr` : '100fr',
                '--dc': dockVisible ? `${(dockSplitRatio * 100).toFixed(1)}fr` : '0fr',
              } as React.CSSProperties
            }
          >
            {dockVisible && (
              <button
                ref={railRef}
                type="button"
                className="qrail"
                title="แสดงรายการ (ปิดตัวอย่าง PDF อัตโนมัติ)"
                aria-label={`แสดงรายการเอกสารที่ปิดแล้ว ${rows.length} ฉบับ และปิดตัวอย่าง PDF`}
                onClick={closeEvidenceDock}
              >
                <Icon name="chevR" size="sm" />
                <span className="vt">เอกสารที่ปิดแล้ว</span>
                <span className="n">{rows.length}</span>
              </button>
            )}

            {!dockVisible && (
              <aside className="col q47" aria-label="รายการเอกสารที่ปิดแล้ว">
                <div className="ph">
                  <span>{groupDef.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{rows.length} ฉบับ</span>
                    <button type="button" className="ibtn" onClick={() => setView('table')} title="กลับไปมุมมองตาราง" aria-label="กลับไปมุมมองตาราง">
                      <Icon name="table" size="sm" />
                    </button>
                  </span>
                </div>
                <div className="srch">
                  <SmartSearchBox id="cdq" variant="list" value={query} onChange={setQuery} resultCount={rows.length} />
                </div>
                <div className="scroll" role="listbox" aria-label="รายการเอกสาร">
                  {rows.length > 0 ? (
                    rows.map(d => (
                      <div key={d.doc} className="cdp-li">
                        <QueueListItem doc={d} isSelected={d.doc === selectedId} onClick={() => setSelectedId(d.doc)} />
                        <ClosedLine d={d} forEu={isEu} />
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      <Icon name="inbox" />
                      ไม่มีเอกสารในกลุ่มและตัวกรองนี้
                    </div>
                  )}
                </div>
              </aside>
            )}

            {selected ? (
              <InvoiceDetailPane
                key={`${selected.doc}:${selected.status}:${selected.history.length}`}
                doc={selected}
                readOnly
                onOpenActionModal={() => {
                  /* read-only page: no action can be opened */
                }}
                closureSlot={<ClosureCard d={selected} onRef={goToDoc} forEu={isEu} />}
              />
            ) : (
              <section className="col detail" id="detail">
                <div className="empty" style={{ margin: 'auto' }}>
                  <Icon name="file" />
                  เลือกเอกสารจากรายการด้านซ้าย
                </div>
              </section>
            )}

            {dockVisible && selected && <EvidenceViewerDock key={selected.doc} doc={selected} />}
          </div>
        )}
      </div>
    </div>
  )
}

/** One table row. */
/** EU: where the payment is, in words the Receiver understands (no batch / AP ids). */
const EU_STAGE: Record<string, string> = {
  Confirmed: 'ขั้น 1/3 · ฝ่ายบัญชีอนุมัติแล้ว รอส่งเข้า Oracle',
  Sent: 'ขั้น 2/3 · กำลังส่งเข้าระบบ Oracle',
  Posted: 'ขั้น 3/3 · ตั้งหนี้ใน Oracle สำเร็จ',
}

/** One table row. */
function ClosedRow({
  d,
  onOpen,
  onRef,
  forEu = false,
  internals = false,
  stale = false,
}: {
  d: InvoiceDoc
  onOpen: (id: string) => void
  onRef: (id: string) => void
  forEu?: boolean
  internals?: boolean
  stale?: boolean
}) {
  const c = closureOf(d)
  const refText = (forEu && EU_STAGE[d.status]) || c.ref || c.reason || '—'
  const age = stale ? sentAgeDays(d) : null
  return (
    <tr
      className={`click${stale ? ' cdp-row-stale' : ''}`}
      tabIndex={0}
      data-doc={d.doc}
      aria-label={`เปิด ${d.inv}`}
      onClick={() => onOpen(d.doc)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(d.doc)
        }
      }}
    >
      <td>
        <b>{d.inv}</b>
        <div className="muted xs mono">{d.doc}</div>
      </td>
      <td>
        <span className="co" style={{ margin: 0 }}>
          {d.company}
        </span>
      </td>
      <td className="fit-td" title={d.vendor}>
        {d.vendor}
      </td>
      <td className="num mono">{money(d.total)}</td>
      <td>
        <ClosedStatusBadge status={d.status} lang={forEu ? 'th' : 'en'} />
        {age !== null && <span className="cdp-age" title="ค้างสถานะกำลังนำส่ง">ค้าง {age} วัน</span>}
      </td>
      <td className="fit-td" title={c.who || undefined}>
        {c.who || <span className="nac">—</span>}
      </td>
      <td className="mono">{dmy(c.date)}</td>
      <td className="fit-td cdp-ref" title={[c.ref, c.reason].filter(Boolean).join(' · ') || undefined}>
        {c.refDoc ? (
          <button
            type="button"
            className="link"
            onClick={e => {
              e.stopPropagation()
              onRef(c.refDoc!)
            }}
          >
            {refText}
          </button>
        ) : (
          refText
        )}
      </td>
      {internals && (
        <>
          <td className="mono xs">{d.identityStatus ?? '—'}</td>
          <td className="mono xs">{d.assigned ?? '—'}</td>
          <td className="mono xs">{d.supRule || d.dupRule || '—'}</td>
          <td className="mono xs fit-td" title={[d.batch, d.apId].filter(Boolean).join(' · ') || undefined}>
            {[d.batch, d.apId].filter(Boolean).join(' · ') || '—'}
          </td>
        </>
      )}
    </tr>
  )
}

/** Small closing line under a list item (split view). */
function ClosedLine({ d, forEu = false }: { d: InvoiceDoc; forEu?: boolean }) {
  const c = closureOf(d)
  const text = [dmy(c.date), c.who, (forEu && EU_STAGE[d.status]) || c.ref || c.reason].filter(x => x && x !== '—').join(' · ')
  return (
    <div className="cdp-line" title={text}>
      <ClosedStatusBadge status={d.status} lang="th" />
      <span className="fit">{text || 'ไม่มีประวัติการปิด'}</span>
    </div>
  )
}

/** Replaces the action bar in the detail pane: who / when / why, read-only. */
function ClosureCard({ d, onRef, forEu = false }: { d: InvoiceDoc; onRef: (id: string) => void; forEu?: boolean }) {
  const c0 = closureOf(d)
  const c = forEu && EU_STAGE[d.status] ? { ...c0, ref: EU_STAGE[d.status], refDoc: undefined } : c0
  const meta = CLOSED_STATUS_META[d.status as ClosedStatus]
  return (
    <div className="abar cdp-closure" role="region" aria-label="สรุปการปิดงาน">
      <ClosedStatusBadge status={d.status} lang={forEu ? 'th' : 'both'} size="lg" />
      <div className="cdp-closure-b">
        <div className="cdp-closure-d">{meta?.desc}</div>
        <div className="cdp-closure-m">
          <span>
            <Icon name="clock" size="sm" /> {dmy(c.date)}
            {c.time ? ` ${c.time.slice(0, 5)}` : ''}
          </span>
          {c.who && (
            <span>
              <Icon name="user" size="sm" /> {c.who}
            </span>
          )}
          {c.reason && (
            <span className="fit" title={c.reason}>
              <Icon name="msg" size="sm" /> {c.reason}
            </span>
          )}
          {c.ref &&
            (c.refDoc ? (
              <button type="button" className="link" onClick={() => onRef(c.refDoc!)}>
                <Icon name="link" size="sm" /> {c.ref}
              </button>
            ) : (
              <span>
                <Icon name="link" size="sm" /> {c.ref}
              </span>
            ))}
        </div>
      </div>
      <span className="cdp-ro" title="เอกสารที่ปิดแล้วแก้ไขหรือเปลี่ยนสถานะจากหน้านี้ไม่ได้">
        <Icon name="lock" size="sm" /> ดูอย่างเดียว
      </span>
    </div>
  )
}

export default ClosedDocsPage
