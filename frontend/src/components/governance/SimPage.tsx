'use client'

import { useState } from 'react'
import { Icon } from '../common/Icon'
import { StatusBadge } from '../common/StatusBadge'
import { useSim } from '../../context/SimContext'
import { useInvoices } from '../../context/InvoiceContext'
import { PRESETS } from '../../mock/presets'
import { ingestValidationResult } from '../../lib/backendApi'

export function SimPage() {
  const {
    preset,
    setPreset,
    payloadJson,
    setPayloadJson,
    runSimulation,
    resetSandbox,
    recs,
    logs,
    trace,
    lastAck,
    activeTab,
    setActiveTab
  } = useSim()


  const { ingestResultToQueue } = useInvoices()
  const [ingesting, setIngesting] = useState(false)

  const handleRun = () => {
    runSimulation()
  }

  const handleIngestToBackend = async () => {
    setIngesting(true)
    try {
      const obj = JSON.parse(payloadJson)
      await ingestValidationResult(obj)
      runSimulation()
      ingestResultToQueue(obj)
    } catch (err: any) {
      alert(`API Ingest Error: ${err.message}`)
    } finally {
      setIngesting(false)
    }
  }

  return (
    <div className="pg">
      <div className="tbar">
        <span className="lab">Document Simulation (Sandbox)</span>
        <span className="scope-note">
          จำลองการส่ง Payload จาก Engine มายัง Portal · ทดสอบกติกา DR-01..07 และความถูกต้อง
        </span>
        <span className="grow" />
        <button
          type="button"
          className="btn btn-sec sm"
          onClick={resetSandbox}
        >
          <Icon name="undo" size="sm" />
          ล้าง Sandbox
        </button>
        <button
          type="button"
          className="btn btn-sec sm"
          onClick={handleRun}
        >
          <Icon name="send" size="sm" />
          จำลองในเครื่อง
        </button>
        <button
          type="button"
          className="btn btn-primary sm"
          disabled={ingesting}
          onClick={handleIngestToBackend}
        >
          <Icon name="check" size="sm" />
          {ingesting ? 'กำลังส่ง API...' : 'ส่งเข้า API & Portal Queue'}
        </button>
      </div>

      <div className="pg-scroll">
        {/* Preset Selector */}
        <div className="panel">
          <div className="panel-h">
            <h3>เลือกเคสจำลอง (Scenario Presets)</h3>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {PRESETS.map(grp => (
                <div key={grp.group} style={{ flex: '1 1 300px' }}>
                  <div className="muted sm b" style={{ marginBottom: 6 }}>
                    {grp.group}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {grp.presets.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`chip ${preset === p.id ? 'on' : ''}`}
                        style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                        onClick={() => setPreset(p.id)}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab switch between Console, Recs, Logs */}
        <div className="tabs" role="tablist" style={{ marginTop: 16 }}>
          <button
            type="button"
            className={`tab ${activeTab === 'console' ? 'on' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            Payload Editor &amp; Trace
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'recs' ? 'on' : ''}`}
            onClick={() => setActiveTab('recs')}
          >
            รายการจำลองในคิว ({recs.length})
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'log' ? 'on' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            Audit Log จำลอง ({logs.length})
          </button>
        </div>

        <div className="pane" style={{ marginTop: 12 }}>
          {activeTab === 'console' && (
            <div className="grid2">
              <div className="panel">
                <div className="panel-h">
                  <h3>Payload JSON (aiva.portal.ingest/1.0)</h3>
                </div>
                <div style={{ padding: 12 }}>
                  <textarea
                    className="set-ta mono"
                    style={{ minHeight: 380, fontSize: 12 }}
                    value={payloadJson}
                    onChange={e => setPayloadJson(e.target.value)}
                  />
                </div>
              </div>

              <div className="panel">
                <div className="panel-h">
                  <h3>Pipeline Execution Trace</h3>
                </div>
                <div style={{ padding: 16 }}>
                  {trace.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {trace.map((step, idx) => (
                        <div
                          key={idx}
                          className={`note ${
                            step.status === 'ok'
                              ? 'ok'
                              : step.status === 'bad'
                              ? 'd'
                              : step.status === 'warn'
                              ? 'w'
                              : 'i'
                          }`}
                        >
                          <Icon
                            name={
                              step.status === 'ok'
                                ? 'checkc'
                                : step.status === 'bad'
                                ? 'x'
                                : step.status === 'warn'
                                ? 'alert'
                                : 'info'
                            }
                          />
                          <div>
                            <b>{step.name}</b>
                            <p style={{ margin: 0, marginTop: 2 }}>{step.detail}</p>
                          </div>
                        </div>
                      ))}

                      {lastAck && (
                        <div className="card" style={{ marginTop: 8 }}>
                          <h4>Portal Response (HTTP {lastAck.http})</h4>
                          <pre className="mono sm" style={{ margin: 0, marginTop: 4 }}>
                            {JSON.stringify(lastAck, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty">
                      <Icon name="play" />
                      คลิก "ส่ง Payload เข้าจำลอง" เพื่อดูผลการประมวลผล
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recs' && (
            <div className="panel">
              <div className="panel-h">
                <h3>รายการที่สร้างใน Sandbox</h3>
                <span className="muted sm">{recs.length} ฉบับ</span>
              </div>
              <div className="tbl-wrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th>รหัส Portal</th>
                      <th>เลขที่ใบแจ้งหนี้</th>
                      <th>บริษัท</th>
                      <th>ผู้ขาย</th>
                      <th>Receiver</th>
                      <th className="num">ยอดรวม</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.length > 0 ? (
                      recs.map(r => (
                        <tr key={r.doc}>
                          <td className="mono">{r.doc}</td>
                          <td><b>{r.inv}</b></td>
                          <td><span className="co" style={{ margin: 0 }}>{r.company}</span></td>
                          <td>{r.vendor}</td>
                          <td className="mono">{r.receiver || '—'}</td>
                          <td className="num">{r.total.toLocaleString()} ฿</td>
                          <td><StatusBadge status={r.status} /></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty">
                            <Icon name="inbox" />
                            ยังไม่มีรายการจำลองใน Sandbox
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="panel">
              <div className="panel-h">
                <h3>ประวัติการส่ง Payload</h3>
              </div>
              <div className="tbl-wrap">
                <table className="t">
                  <thead>
                    <tr>
                      <th>เวลา</th>
                      <th>Message ID</th>
                      <th>HTTP</th>
                      <th>ผลลัพธ์</th>
                      <th>Portal Doc ID</th>
                      <th>กติกาที่ใช้</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map((l, idx) => (
                        <tr key={idx} className={l.http >= 400 ? 'row-bad' : ''}>
                          <td className="mono">{l.t}</td>
                          <td className="mono">{l.mid}</td>
                          <td className="mono">{l.http}</td>
                          <td><b>{l.result}</b></td>
                          <td className="mono">{l.pid}</td>
                          <td>{l.rule}</td>
                          <td>{l.note}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <div className="empty">
                            <Icon name="inbox" />
                            ยังไม่มีประวัติการส่ง Payload
                          </div>
                        </td>
                      </tr>
                    )}
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

export default SimPage
