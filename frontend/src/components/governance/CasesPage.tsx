import { Fragment } from 'react'
import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { useInvoices } from '../../context/InvoiceContext'
import { useAuth } from '../../context/AuthContext'
import { USERS } from '../../mock/users'
import { SEVERITY_OF_CODE } from '../../mock/rules'

export function CasesPage() {
  const { docs, selectDoc, setViewMode } = useInvoices()
  const { scopeCheck } = useAuth()

  const groups = Array.from(new Set(docs.map(d => d.grp || 'G · อัปโหลดระหว่างทดสอบ'))).sort()

  const handleOpenDoc = (docId: string) => {
    selectDoc(docId)
    setViewMode('split')
  }

  const euUsersWhoSee = (doc: any) => {
    const list = USERS.filter(u => u.role === 'EU' && scopeCheck(doc).ok)
    return list.map(u => u.n).join(', ') || 'ไม่มี'
  }

  const accUsersWhoSee = (doc: any) => {
    const list = USERS.filter(u => ['ACC', 'APR'].includes(u.role) && scopeCheck(doc).ok)
    return list.map(u => u.n.split(' ')[0]).join(', ') || 'ไม่มี'
  }

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">ชุดเอกสารทดสอบ</span>
        <span className="scope-note">
          {docs.length} ฉบับ · ค่าสมมติทั้งหมด · ครอบคลุม E01–E15 · Manual Review 3 แบบ · Matrix 8B ทุกแถว · DR-01..DR-07 · AP Interface · ช่วงเวลา 3 เดือน
        </span>
      </div>

      <div className="pg-scroll">
        <div className="note i" style={{ marginBottom: 12 }}>
          <Icon name="info" />
          <div>
            คลิก <b>เปิด</b> เพื่อดูเอกสารในคิว (ล้างตัวกรองให้อัตโนมัติ) · ปุ่มเปิดใช้ได้เฉพาะเอกสารในขอบเขตของผู้ใช้ปัจจุบัน · สลับผู้ใช้ที่มุมขวาบนเพื่อทดสอบสิทธิ์
          </div>
        </div>

        <div className="panel">
          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>#</th>
                  <th>เคสทดสอบ</th>
                  <th>เลขที่ใบแจ้งหนี้</th>
                  <th>บริษัท</th>
                  <th>เข้าระบบ</th>
                  <th>สถานะ</th>
                  <th>รหัส</th>
                  <th>ผู้ใช้งานที่เห็น</th>
                  <th>ฝ่ายบัญชีที่เห็น</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => {
                  const groupDocs = docs.filter(d => (d.grp || 'G · อัปโหลดระหว่างทดสอบ') === g)
                  return (
                    <Fragment key={g}>
                      <tr className="grp-h">
                        <td colSpan={10}>
                          {g} · {groupDocs.length} ฉบับ
                        </td>
                      </tr>

                      {groupDocs.map((d, idx) => {
                        const canAccess = scopeCheck(d).ok
                        return (
                          <tr key={d.doc}>
                            <td className="num">{idx + 1}</td>
                            <td>{d.tc || '—'}</td>
                            <td>
                              <b>{d.inv}</b>
                              <div className="muted xs mono">{d.doc}</div>
                            </td>
                            <td>
                              <span className="co" style={{ margin: 0 }}>
                                {d.company}
                              </span>
                            </td>
                            <td className="mono">{d.up}</td>
                            <td>
                              <StatusBadge status={d.status} />
                            </td>
                            <td>
                              {d.codes.length > 0 ? (
                                d.codes.map(c => (
                                  <span
                                    key={c}
                                    className={`code ${SEVERITY_OF_CODE[c] || 'High'}`}
                                    style={{ marginRight: 4 }}
                                  >
                                    {c}
                                  </span>
                                ))
                              ) : (
                                <span className="nac">—</span>
                              )}
                            </td>
                            <td className="sm">{euUsersWhoSee(d)}</td>
                            <td className="sm">{accUsersWhoSee(d)}</td>
                            <td>
                              {canAccess ? (
                                <button
                                  type="button"
                                  className="btn btn-sec sm"
                                  onClick={() => handleOpenDoc(d.doc)}
                                >
                                  <Icon name="ext" size="sm" />
                                  เปิด
                                </button>
                              ) : (
                                <span className="muted xs">นอกสิทธิ์</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  )
                })}

              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CasesPage
