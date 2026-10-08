import { useState } from 'react'
import { Icon } from '../common/Icon'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useToastModal } from '../../context/ToastModalContext'
import { USERS } from '../../mock/users'
import { RULES } from '../../mock/rules'

export function SettingsPage() {
  const { can } = useAuth()
  const {
    pref,
    savePref,
    orgSettings,
    saveStaleDays,
    saveLimit,
    accountMaps,
    addMapping,
    delMapping,
    settingLogs
  } = useSettings()
  const { toast } = useToastModal()

  const [activeTab, setActiveTab] = useState<'personal' | 'org' | 'rules' | 'admin' | 'hist'>('personal')
  const [staleDaysInput, setStaleDaysInput] = useState<number>(orgSettings.staleDays)
  const [limitInput, setLimitInput] = useState<number>(orgSettings.limit.APR || 1000000)
  const [mfaPin, setMfaPin] = useState<string>('')

  // Mapping Form
  const [mapUserId, setMapUserId] = useState<string>(USERS[0].id)
  const [mapAcct, setMapAcct] = useState<string>('')
  const [mapReq, setMapReq] = useState<string>('')

  const handleSaveStaleDays = () => {
    const res = saveStaleDays(staleDaysInput)
    if (!res.ok) toast(res.msg || 'เกิดข้อผิดพลาด', true)
    else toast('บันทึกจำนวนวันค้างนานแล้ว')
  }

  const handleSaveLimit = () => {
    const res = saveLimit(limitInput, mfaPin)
    if (!res.ok) toast(res.msg || 'เกิดข้อผิดพลาด', true)
    else {
      toast('บันทึกวงเงินแล้ว')
      setMfaPin('')
    }
  }

  const handleAddMap = () => {
    if (!mapAcct.trim() || !mapReq.trim()) {
      toast('กรุณาระบุชื่อ Oracle Account และเลขที่ Ticket อ้างอิง', true)
      return
    }
    const res = addMapping(mapUserId, mapAcct.trim(), mapReq.trim())
    if (!res.ok) toast(res.msg || 'เกิดข้อผิดพลาด', true)
    else {
      toast('เพิ่มการผูกบัญชีแล้ว')
      setMapAcct('')
      setMapReq('')
    }
  }

  const handleDeleteMap = (id: string) => {
    const res = delMapping(id, 'ลบโดยผู้ดูแลระบบ')
    if (!res.ok) toast(res.msg || 'เกิดข้อผิดพลาด', true)
    else toast('ลบการผูกบัญชีแล้ว')
  }

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">ตั้งค่าระบบ</span>
        <span className="scope-note">
          ค่าส่วนบุคคล · นโยบายองค์กร · กฎทางธุรกิจ · การผูกบัญชี Oracle
        </span>
      </div>

      <div className="pg-scroll">
        <div className="tabs" role="tablist">
          <button
            type="button"
            className={`tab ${activeTab === 'personal' ? 'on' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            ค่าส่วนบุคคล
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'org' ? 'on' : ''}`}
            onClick={() => setActiveTab('org')}
          >
            นโยบายองค์กร
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'rules' ? 'on' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            กฎทางธุรกิจ (v6.10)
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'admin' ? 'on' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            ผูกบัญชี Oracle (IT)
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'hist' ? 'on' : ''}`}
            onClick={() => setActiveTab('hist')}
          >
            ประวัติการแก้ไข
          </button>
        </div>

        <div className="pane" style={{ marginTop: 16 }}>
          {activeTab === 'personal' && (
            <div className="panel">
              <div className="panel-h">
                <h3>การแสดงผลคอลัมน์ในตาราง</h3>
              </div>
              <div style={{ padding: 16 }}>
                <p className="muted sm">เลือกคอลัมน์ที่ต้องการแสดงในมุมมองตารางสรุป</p>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(pref.cols || {}).map(([colKey, val]) => (
                    <label key={colKey} className="chk">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={e =>
                          savePref({
                            ...pref,
                            cols: { ...pref.cols, [colKey]: e.target.checked }
                          })
                        }
                      />
                      <span>คอลัมน์ {colKey.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'org' && (
            <div className="grid2">
              <div className="panel">
                <div className="panel-h">
                  <h3>เกณฑ์เอกสารค้างนาน (Stale Days)</h3>
                </div>
                <div style={{ padding: 16 }}>
                  <p className="muted sm">
                    เอกสารที่ยังไม่ได้รับการจัดการเกินจำนวนวันนี้จะถูกไฮไลต์เป็นสีส้ม/แดง
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      className="inp"
                      style={{ width: 120 }}
                      value={staleDaysInput}
                      onChange={e => setStaleDaysInput(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="btn btn-primary sm"
                      onClick={handleSaveStaleDays}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-h">
                  <h3>วงเงินตั้งหนี้สูงสุด (AP Limit)</h3>
                </div>
                <div style={{ padding: 16 }}>
                  <p className="muted sm">
                    วงเงินสูงสุดที่หัวหน้าฝ่ายบัญชีสามารถส่งเข้า AP Interface ได้ (ต้องใช้ MFA PIN)
                  </p>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="number"
                      className="inp"
                      value={limitInput}
                      onChange={e => setLimitInput(Number(e.target.value))}
                    />
                    <input
                      type="password"
                      className="inp"
                      placeholder="MFA PIN (ใช้ 1234)"
                      value={mfaPin}
                      onChange={e => setMfaPin(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary sm"
                      onClick={handleSaveLimit}
                    >
                      ยืนยันการตั้งค่า
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="panel">
              <div className="panel-h">
                <h3>กฎการตรวจสอบมาตรฐาน Standard v6.10 (ล็อกโดยระบบ)</h3>
              </div>
              <div className="tbl-wrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ชื่อกฎ</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RULES.map((r: string, i: number) => (
                      <tr key={r}>
                        <td className="num">{i + 1}</td>
                        <td><b>{r}</b></td>
                        <td>
                          <span className="lockbadge">
                            <Icon name="lock" size="sm" /> ล็อกตามมาตรฐาน
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="panel">
              <div className="panel-h">
                <h3>การผูก Oracle Account กับ Entra ID Users (IT Admin)</h3>
              </div>
              <div style={{ padding: 16 }}>
                {can('MAP') ? (
                  <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      className="sel"
                      value={mapUserId}
                      onChange={e => setMapUserId(e.target.value)}
                    >
                      {USERS.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.n} ({u.role})
                        </option>
                      ))}
                    </select>
                    <input
                      className="inp"
                      placeholder="Oracle Account (เช่น SOMSAK JAIDEE)"
                      value={mapAcct}
                      onChange={e => setMapAcct(e.target.value)}
                    />
                    <input
                      className="inp"
                      placeholder="Ticket อ้างอิง (เช่น INC-1021)"
                      value={mapReq}
                      onChange={e => setMapReq(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary sm"
                      onClick={handleAddMap}
                    >
                      + เพิ่มการผูกบัญชี
                    </button>
                  </div>
                ) : (
                  <div className="note w" style={{ marginBottom: 16 }}>
                    <Icon name="lock" />
                    <div>เฉพาะผู้ดูแลระบบ IT เท่านั้นที่จัดการการผูกบัญชีได้</div>
                  </div>
                )}

                <div className="tbl-wrap">
                  <table className="t">
                    <thead>
                      <tr>
                        <th>ผู้ใช้งาน</th>
                        <th>Oracle Account</th>
                        <th>ผู้ทำรายการ</th>
                        <th>วันที่</th>
                        <th>Ticket อ้างอิง</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountMaps.map(m => {
                        const targetUser = USERS.find(u => u.id === m.user)
                        return (
                          <tr key={m.id}>
                            <td>{targetUser?.n}</td>
                            <td className="mono">{m.acct}</td>
                            <td>{m.by}</td>
                            <td className="mono">{m.at}</td>
                            <td className="mono">{m.req}</td>
                            <td>
                              {can('MAP') && (
                                <button
                                  type="button"
                                  className="btn btn-danger sm"
                                  onClick={() => handleDeleteMap(m.id)}
                                >
                                  ลบ
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hist' && (
            <div className="panel">
              <div className="panel-h">
                <h3>ประวัติการเปลี่ยนแปลงการตั้งค่า</h3>
              </div>
              <div className="tbl-wrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th>วันที่</th>
                      <th>เวลา</th>
                      <th>ผู้แก้ไข</th>
                      <th>บทบาท</th>
                      <th>รายการที่แก้</th>
                      <th>ค่าเดิม</th>
                      <th>ค่าใหม่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settingLogs.map((l, i) => (
                      <tr key={i}>
                        <td className="mono">{l.dt}</td>
                        <td className="mono">{l.t}</td>
                        <td>{l.who}</td>
                        <td>{l.role}</td>
                        <td>{l.what}</td>
                        <td>{l.o}</td>
                        <td><b>{l.n}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
