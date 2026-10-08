import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'

export function AuditPage() {
  const { auditLogs, can } = useAuth()

  if (!can('AUDIT')) {
    return (
      <div className="pg-scroll">
        <div className="panel">
          <div className="empty">
            <Icon name="lock" />
            ไม่มีสิทธิ์เข้าถึงหน้านี้
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">บันทึกการเข้าถึงและการดำเนินการ</span>
        <span className="scope-note">
          {auditLogs.length} รายการ · ไม่สามารถแก้ไขได้
        </span>
      </div>

      <div className="pg-scroll">
        <div className="panel">
          <div className="tbl-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เวลา</th>
                  <th>ผู้ใช้</th>
                  <th>บทบาท</th>
                  <th>การดำเนินการ</th>
                  <th>เอกสาร</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((a, i) => (
                  <tr
                    key={i}
                    className={/ปฏิเสธ|ไม่สำเร็จ/.test(a.act) ? 'row-bad' : ''}
                  >
                    <td className="mono">{a.dt}</td>
                    <td className="mono">{a.t}</td>
                    <td>{a.who}</td>
                    <td>{a.role}</td>
                    <td>{a.act}</td>
                    <td className="mono">{a.doc}</td>
                    <td>{a.detail}</td>
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

export default AuditPage
