'use client'

import { Icon } from '../common/Icon'
import { FilterChip } from '../common/FilterChip'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useInvoices } from '../../context/InvoiceContext'
import { DateRangeTool } from './DateRangeTool'
import { COMPANIES } from '../../mock/companies'
import { acctsOf } from '../../mock/users'

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
    false

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

      {/* v5.8: one date tool — which date (เข้าระบบ / สร้าง / ใบแจ้งหนี้) + range */}
      <span className="lab">ช่วงเวลา</span>
      <DateRangeTool />


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
