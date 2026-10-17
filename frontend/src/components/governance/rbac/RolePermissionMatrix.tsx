'use client'

import React, { useState } from 'react'
import { RoleKey, Permission } from '@/types/auth'
import { ROLES, PERMISSION_DESCRIPTIONS } from '@/mock/users'
import { Icon } from '@/components/common/Icon'

export function RolePermissionMatrix() {
  const [search, setSearch] = useState('')
  const roleKeys: RoleKey[] = ['EU', 'ACC', 'APR', 'ADM', 'SA']
  const permKeys = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[]

  const filteredPerms = permKeys.filter(pk => {
    if (!search.trim()) return true
    const q = search.toLowerCase().trim()
    return pk.toLowerCase().includes(q) || PERMISSION_DESCRIPTIONS[pk].toLowerCase().includes(q)
  })

  return (
    <div className="panel" data-testid="role-permission-matrix">
      <div className="panel-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3>Matrix สิทธิ์ตามบทบาท (ตารางที่ 6)</h3>
          <span style={{ fontSize: 12, color: 'var(--s-500)', display: 'block', marginTop: 2 }}>
            ความสัมพันธ์ระหว่าง Role กับ Operations ทั้ง 16 สิทธิ์ในระบบ AIVA
          </span>
        </div>
        <div style={{ position: 'relative', width: 280 }}>
          <input
            type="text"
            placeholder="ค้นหาสิทธิ์ หรือคำอธิบาย…"
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
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>
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
      </div>

      <div className="tbl-wrap">
        <table className="t mx pm-mx">
          <thead>
            <tr>
              <th style={{ width: 150 }}>สิทธิ์ (Code)</th>
              <th>คำอธิบายสิทธิ์</th>
              {roleKeys.map(rk => {
                const r = ROLES[rk]
                return (
                  <th key={rk} style={{ textAlign: 'center', width: 95 }}>
                    <div className="pm-th">
                      <span
                        className="role-pill"
                        title={r.n}
                        style={{ background: r.bg, color: r.c }}
                      >
                        {rk}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--s-500)', whiteSpace: 'nowrap' }}>
                        {r.n}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filteredPerms.map(pk => (
              <tr key={pk}>
                <td className="mono" style={{ fontWeight: 700, color: 'var(--ink-2)' }}>
                  {pk}
                </td>
                <td style={{ color: 'var(--s-700)' }}>
                  {PERMISSION_DESCRIPTIONS[pk]}
                </td>
                {roleKeys.map(rk => {
                  const hasPerm = ROLES[rk].p.includes(pk)
                  return (
                    <td
                      key={rk}
                      className={hasPerm ? 'cell ok' : 'cell'}
                      style={{ textAlign: 'center' }}
                    >
                      {hasPerm ? (
                        <span className="pm-ck" title={`อนุญาตสำหรับ ${rk}`}>
                          <Icon name="check" size="sm" />
                        </span>
                      ) : (
                        <span className="pm-no" title="ไม่อนุญาต">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
