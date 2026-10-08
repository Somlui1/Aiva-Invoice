import { PERMISSION_DESCRIPTIONS, ROLES, USERS, acctsOf } from '../../mock/users'
import { COMPANIES, ORG_NAMES } from '../../mock/companies'
import { Permission } from '../../types/auth'

export function RbacPage() {
  const permKeys = Object.keys(PERMISSION_DESCRIPTIONS) as Permission[]
  const roleKeys = Object.keys(ROLES) as Array<keyof typeof ROLES>

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">สิทธิ์และการเชื่อมบัญชี</span>
        <span className="scope-note">
          Entra ID ↔ RECEIVER (Oracle) ↔ บริษัท · ผู้ดูแลระบบจัดการได้ แต่ไม่เห็นเนื้อหาเอกสาร
        </span>
      </div>

      <div className="pg-scroll">
        {/* Permission Matrix */}
        <div className="panel">
          <div className="panel-h">
            <h3>Matrix สิทธิ์ตามบทบาท (ตารางที่ 6)</h3>
          </div>
          <div className="tbl-wrap">
            <table className="t mx">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>สิทธิ์</th>
                  <th>คำอธิบาย</th>
                  {roleKeys.map(rk => (
                    <th key={rk} style={{ textAlign: 'center', width: 90 }}>
                      <span
                        className="role-pill"
                        style={{ background: ROLES[rk].bg, color: ROLES[rk].c }}
                      >
                        {rk}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permKeys.map(pk => (
                  <tr key={pk}>
                    <td className="mono">{pk}</td>
                    <td>{PERMISSION_DESCRIPTIONS[pk]}</td>
                    {roleKeys.map(rk => {
                      const hasPerm = ROLES[rk].p.includes(pk)
                      return (
                        <td
                          key={rk}
                          className={hasPerm ? 'cell ok' : 'cell'}
                          style={{ textAlign: 'center' }}
                        >
                          {hasPerm ? (
                            <span style={{ color: 'var(--ok)', fontWeight: 'bold' }}>✓</span>
                          ) : (
                            <span className="nac">—</span>
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

        {/* User Mapping Table */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-h">
            <h3>ผู้ใช้งานในระบบและการผูกบัญชี (ตารางที่ 5)</h3>
          </div>
          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>Entra ID</th>
                  <th>บทบาท</th>
                  <th>หน่วยงาน</th>
                  <th>Oracle account (Receiver)</th>
                  <th>บริษัทที่รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.n}</b>
                    </td>
                    <td className="mono">{u.email}</td>
                    <td>
                      <span
                        className="role-pill"
                        style={{
                          background: ROLES[u.role].bg,
                          color: ROLES[u.role].c
                        }}
                      >
                        {ROLES[u.role].n}
                      </span>
                    </td>
                    <td>{u.unit}</td>
                    <td className="mono">
                      {acctsOf(u).join(', ') || (
                        <span className="nac">—</span>
                      )}
                    </td>
                    <td>
                      {u.co.map(c => (
                        <span key={c} className="co" style={{ margin: '0 4px 0 0' }}>
                          {c}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company & Org IDs Table */}
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-h">
            <h3>บริษัทและ ORG_ID (ตารางที่ 4)</h3>
          </div>
          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>บริษัท</th>
                  <th>ชื่อ</th>
                  <th>Tax ID</th>
                  <th>ORG_ID</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(COMPANIES).map(([k, c]) => (
                  <tr key={k}>
                    <td>
                      <span className="co" style={{ margin: 0 }}>
                        {k}
                      </span>
                    </td>
                    <td>{c.name}</td>
                    <td className="mono">{c.tax}</td>
                    <td className="mono">
                      {c.orgs.map(o => `${o} ${ORG_NAMES[o] || ''}`).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RbacPage
