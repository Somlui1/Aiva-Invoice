'use client'

import { Icon } from '../common/Icon'
import { FilterChip } from '../common/FilterChip'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useInvoices, perRange } from '../../context/InvoiceContext'
import { COMPANIES } from '../../mock/companies'
import { acctsOf } from '../../mock/users'

const PER_OPTIONS = [
  { k: 'all', label: 'ทั้งหมด' },
  { k: 'today', label: 'วันนี้' },
  { k: '7d', label: '7 วันล่าสุด' },
  { k: 'month', label: 'เดือนนี้' },
  { k: 'lastm', label: 'เดือนก่อน' },
  { k: 'period', label: 'เลือกงวด' },
  { k: 'custom', label: 'กำหนดเอง' }
]

export function QueueToolbar() {
  const { currentUser } = useAuth()
  const { accountMaps } = useSettings()
  const {
    visibleDocs,
    companyFilter,
    toggleCompanyFilter,
    setAllCompanies,
    receiverFilter,
    setReceiverFilter,
    periodFilter,
    setPeriodFilter,
    showClosed,
    toggleShowClosed,
    viewMode,
    setViewMode,
    clearFilters
  } = useInvoices()

  const isEu = currentUser.role === 'EU'
  const userAccts = acctsOf(currentUser, accountMaps)
  const accounts = userAccts.join(', ') || '— ยังไม่ถูกผูก'

  const hasActiveFilters =
    companyFilter.size > 0 ||
    Boolean(receiverFilter) ||
    periodFilter.k !== 'all' ||
    (isEu ? false : showClosed)

  const range = perRange(periodFilter)
  const rangeLabel = range
    ? `${range[0] === '0000-01-01' ? '…' : range[0]} – ${range[1] === '9999-12-31' ? '…' : range[1]}`
    : 'ทุกช่วงเวลา'

  return (
    <div className="tbar" id="tbar">
      {isEu ? (
        <>
          <span className="lab">ขอบเขต Receiver</span>
          {userAccts.length > 0 ? (
            <>
              <FilterChip
                label="ทุก Receiver ของฉัน"
                count={visibleDocs.length}
                active={!receiverFilter}
                onClick={() => setReceiverFilter(null)}
              />
              {userAccts.map(acct => {
                const count = visibleDocs.filter(d => d.receiver === acct).length
                return (
                  <FilterChip
                    key={acct}
                    label={acct}
                    count={count}
                    active={receiverFilter === acct}
                    onClick={() => setReceiverFilter(receiverFilter === acct ? null : acct)}
                  />
                )
              })}
            </>
          ) : (
            <span className="scope-note">
              <Icon name="user" size="sm" />
              เฉพาะใบรับที่ <b>Oracle account: {accounts}</b>
            </span>
          )}
          <span className="chip on" style={{ cursor: 'default' }}>
            {currentUser.co.join(', ')}
          </span>
          <span className="scope-note">
            <Icon name="info" size="sm" />
            เอกสารที่ยังไม่มีใบรับ ฝ่ายบัญชีเป็นผู้ดำเนินการ
          </span>
        </>
      ) : (
        <>
          <span className="lab">ขอบเขตบริษัท</span>
          <FilterChip
            label="ทุกบริษัท"
            count={visibleDocs.length}
            active={companyFilter.size === 0}
            onClick={setAllCompanies}
          />
          {currentUser.co.map(c => {
            const count = visibleDocs.filter(d => d.company === c).length
            return (
              <FilterChip
                key={c}
                label={c}
                count={count}
                active={companyFilter.has(c)}
                onClick={() => toggleCompanyFilter(c)}
                title={COMPANIES[c]?.name}
              />
            )
          })}
        </>
      )}

      <span className="vsep" aria-hidden="true" />

      {/* Period Selector */}
      <span className="lab">ช่วงเวลา</span>
      <select
        className="sel"
        aria-label="ช่วงเวลา"
        value={periodFilter.k}
        onChange={e =>
          setPeriodFilter({
            k: e.target.value,
            ym: e.target.value === 'period' ? '2026-10' : undefined
          })
        }
      >
        {PER_OPTIONS.map(opt => (
          <option key={opt.k} value={opt.k}>
            {opt.label}
          </option>
        ))}
      </select>

      {periodFilter.k === 'period' && (
        <input
          type="month"
          className="inp"
          aria-label="งวด"
          value={periodFilter.ym || '2026-10'}
          onChange={e => setPeriodFilter({ ...periodFilter, ym: e.target.value })}
        />
      )}

      {periodFilter.k === 'custom' && (
        <>
          <input
            type="date"
            className="inp"
            aria-label="ตั้งแต่วันที่"
            value={periodFilter.from || ''}
            onChange={e => setPeriodFilter({ ...periodFilter, from: e.target.value })}
          />
          <span className="muted sm">ถึง</span>
          <input
            type="date"
            className="inp"
            aria-label="ถึงวันที่"
            value={periodFilter.to || ''}
            onChange={e => setPeriodFilter({ ...periodFilter, to: e.target.value })}
          />
        </>
      )}

      <span className="scope-note">
        <Icon name="clock" size="sm" />
        ตามวันที่เข้าระบบ · <b>{rangeLabel}</b>
      </span>

      {!isEu && (
        <button
          type="button"
          className={`chip ${showClosed ? 'on' : ''}`}
          aria-pressed={showClosed}
          onClick={toggleShowClosed}
          title="Posted / Rejected / Superseded"
        >
          รวมที่ปิดแล้ว
        </button>
      )}

      {hasActiveFilters && (
        <button type="button" className="chip" onClick={clearFilters}>
          <Icon name="x" size="sm" />
          ล้างตัวกรอง
        </button>
      )}

      <span className="grow" />

      <div className="seg" role="group" aria-label="มุมมอง">
        <button
          type="button"
          className={viewMode === 'split' ? 'on' : ''}
          onClick={() => setViewMode('split')}
        >
          <Icon name="split" size="sm" />
          แยก 2 ฝั่ง
        </button>
        <button
          type="button"
          className={viewMode === 'table' ? 'on' : ''}
          onClick={() => setViewMode('table')}
        >
          <Icon name="table" size="sm" />
          ตารางสรุป
        </button>
      </div>
    </div>
  )
}

export default QueueToolbar
