'use client'

import React, { useState } from 'react'
import { CompanyMasterInfo } from '@/mock/companies26'
import { Icon } from '@/components/common/Icon'

interface CompanyScopeMatrixProps {
  companies: CompanyMasterInfo[]
  onSyncOracle: () => Promise<void>
  isSyncing: boolean
  syncStatus: string | null
  syncedAt: string | null
}

export function CompanyScopeMatrix({
  companies,
  onSyncOracle,
  isSyncing,
  syncStatus,
  syncedAt,
}: CompanyScopeMatrixProps) {
  const [search, setSearch] = useState('')

  const filteredCompanies = companies.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.ouName && c.ouName.toLowerCase().includes(q)) ||
      (c.taxId && c.taxId.toLowerCase().includes(q)) ||
      (c.ledgerName && c.ledgerName.toLowerCase().includes(q)) ||
      String(c.orgId).includes(q)
    )
  })

  return (
    <div className="panel" data-testid="company-scope-matrix">
      <div
        className="panel-h"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3>บริษัทและ ORG_ID (ตารางที่ 4)</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--s-500)' }}>
              แสดง {filteredCompanies.length} จาก {companies.length} บริษัท
            </span>
            {syncedAt && (
              <span style={{ fontSize: 11, color: 'var(--s-500)' }}>
                (อัปเดตล่าสุด: {syncedAt})
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 320 }}>
            <input
              type="text"
              role="searchbox"
              aria-label="ค้นหาบริษัท"
              placeholder="ค้นหาตามรหัสย่อ, ชื่อบริษัท, Tax ID หรือ ORG_ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                fontSize: 12.5,
                border: '1px solid var(--line-strong)',
                borderRadius: 6,
                background: 'var(--surface)',
                color: 'inherit',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.5,
                pointerEvents: 'none',
              }}
            >
              <Icon name="search" size="sm" />
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--s-400)',
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {syncStatus && (
            <span
              style={{
                fontSize: 12,
                color: syncStatus.includes('สำเร็จ') ? 'var(--ok)' : 'var(--err)',
              }}
            >
              {syncStatus}
            </span>
          )}

          <button
            type="button"
            onClick={onSyncOracle}
            disabled={isSyncing}
            className="btn-xl-add"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12.5,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
            }}
          >
            {isSyncing ? (
              <>
                <span
                  className="spin"
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                  }}
                />
                กำลังซิงค์ข้อมูลจาก Oracle…
              </>
            ) : (
              <>
                <Icon name="refresh" size="sm" />
                Sync ข้อมูลจาก Oracle
              </>
            )}
          </button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="t pm-cg">
          <thead>
            <tr>
              <th style={{ width: 80 }}>รหัสย่อ</th>
              <th>ชื่อนิติบุคคล (Company Name)</th>
              <th style={{ width: 140 }}>Tax ID</th>
              <th style={{ width: 180 }}>Operating Unit (OU)</th>
              <th style={{ width: 160 }}>Ledger</th>
              <th style={{ width: 90, textAlign: 'center' }}>ORG_ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--s-400)' }}>
                  ไม่พบบริษัทที่ตรงกับคำค้นหา
                </td>
              </tr>
            ) : (
              filteredCompanies.map(c => (
                <tr key={c.code}>
                <td>
                  <span className="co" style={{ fontWeight: 800 }}>
                    {c.code}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="mono" style={{ color: 'var(--s-600)' }}>
                  {c.taxId || '—'}
                </td>
                <td style={{ color: 'var(--s-700)' }}>{c.ouName || '—'}</td>
                <td className="mono" style={{ fontSize: 11.5, color: 'var(--s-600)' }}>
                  {c.ledgerName || '—'}
                </td>
                <td className="mono" style={{ textAlign: 'center', fontWeight: 700 }}>
                  {c.orgId || '—'}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
