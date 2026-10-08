import React, { createContext, useContext, useState, useCallback } from 'react'
import { SimRecord, SimTraceStep } from '../types/sim'
import { PRESETS } from '../mock/presets'
import { companyOfOrg, companyOfTax, COMPANIES } from '../mock/companies'
import { SEVERITY_OF_CODE } from '../mock/rules'


export interface SimLogEntry {
  t: string
  mid: string
  http: number
  result: string
  pid: string
  rule: string
  note: string
}

export interface ValidationReport {
  errors: string[]
  warnings: string[]
}

interface SimContextType {
  preset: string
  setPreset: (presetId: string) => void
  payloadJson: string
  setPayloadJson: (json: string) => void
  recs: SimRecord[]
  logs: SimLogEntry[]
  selectedRecId: string | null
  setSelectedRecId: (id: string | null) => void
  trace: SimTraceStep[]
  lastAck: any
  validationReport: ValidationReport | null
  runSimulation: (customPayload?: Record<string, unknown>) => { ack: any; trace: SimTraceStep[] }
  resetSandbox: () => void
  activeTab: 'console' | 'recs' | 'log' | 'spec'
  setActiveTab: (tab: 'console' | 'recs' | 'log' | 'spec') => void
}

const SimContext = createContext<SimContextType | null>(null)

const PSTD = { contract: 'aiva.portal.ingest/1.0', endpoint: 'POST /api/v1/ingest/validation-results' }
const REC_ENUM = ['AUTO_PASS', 'REVIEW', 'HOLD', 'MANUAL_REVIEW', 'SYSTEM_ERROR']
const ID_ENUM = ['RESOLVED', 'NOT_FOUND', 'UNRESOLVED']
const AP_ST = ['Confirmed', 'Sent', 'Posted', 'Import Failed']
const CLOSED_ST = ['Rejected', 'Superseded', 'Duplicate']
const RANK: Record<string, number> = { 'Auto-pass': 1, Review: 2, Hold: 3, 'Manual Review': 4 }

function getP(o: any, path: string): any {
  return path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o)
}

export function validatePayload(p: any): ValidationReport {
  const errors: string[] = []
  const warnings: string[] = []
  if (!p || typeof p !== 'object') {
    errors.push('Payload ต้องเป็น JSON Object')
    return { errors, warnings }
  }

  if (p.contract !== PSTD.contract) {
    errors.push(`contract ต้องเป็น ${PSTD.contract}`)
  }
  if (!p.message_id) {
    errors.push('message_id บังคับระบุ')
  }

  const st = getP(p, 'identity.status')
  if (!ID_ENUM.includes(st)) {
    errors.push(`identity.status ต้องเป็น ${ID_ENUM.join(' | ')}`)
  }

  const res = st === 'RESOLVED'
  const rid = getP(p, 'identity.receive_id')

  if (res && (!rid || !/^[A-Z0-9-]{4,30}$/.test(rid))) {
    errors.push('RESOLVED ต้องมี identity.receive_id (A-Z 0-9 - ยาว 4–30)')
  }
  if (st && !res) {
    if (rid != null) errors.push(`${st} ต้องส่ง identity.receive_id = null`)
    if (p.receipt != null) errors.push(`${st} ต้องส่ง receipt = null`)
  }
  if (st === 'UNRESOLVED' && !(getP(p, 'identity.missing_keys') || []).length) {
    errors.push('UNRESOLVED ต้องระบุ identity.missing_keys')
  }

  const rec = getP(p, 'decision.recommendation')
  if (rec !== undefined && !REC_ENUM.includes(rec)) {
    errors.push(`decision.recommendation ต้องเป็น ${REC_ENUM.join(' | ')}`)
  }

  if (st === 'UNRESOLVED' && rec && !['MANUAL_REVIEW', 'SYSTEM_ERROR'].includes(rec)) {
    warnings.push(`UNRESOLVED แต่ recommendation = ${rec} → Portal บังคับเป็น Manual Review`)
  }
  if (res && rec === 'MANUAL_REVIEW') {
    warnings.push('RESOLVED แต่ได้ MANUAL_REVIEW → Manual Review แบบทราบเจ้าของ')
  }
  if (res && getP(p, 'receipt.receiver') == null) {
    warnings.push('ใบรับไม่มี RECEIVER → End User ไม่เห็นรายการนี้')
  }

  return { errors, warnings }
}

function buildMockPayload(o: any, seq: number): Record<string, unknown> {
  const id = o.idStatus || (o.rid ? 'RESOLVED' : 'UNRESOLVED')
  const res = id === 'RESOLVED'
  const missing = id === 'UNRESOLVED' ? o.missing || ['invoice_num', 'po_number'] : []
  const codes = (o.codes || []).filter((c: string) => SEVERITY_OF_CODE[c])
  const rec =
    o.rec && o.rec !== 'auto'
      ? o.rec
      : id === 'UNRESOLVED'
      ? 'MANUAL_REVIEW'
      : codes.some((c: string) => SEVERITY_OF_CODE[c] === 'High')
      ? 'HOLD'
      : codes.some((c: string) => SEVERITY_OF_CODE[c] === 'Medium')
      ? 'REVIEW'
      : 'AUTO_PASS'

  const tot = o.total || 10700
  const sub = Math.round((tot / 1.07) * 100) / 100
  const vat = Math.round((tot - sub) * 100) / 100
  const co = o.org ? companyOfOrg(o.org) : o.co || 'AH'
  const ctax = 'ctax' in o ? o.ctax : COMPANIES[co]?.tax !== '—' ? COMPANIES[co]?.tax : null
  const pos = missing.includes('po_number') ? [] : o.pos || ['40130' + (200 + seq)]
  const dms = o.dms || `DMS-2026-SIM${String(seq).padStart(4, '0')}`
  const inv = missing.includes('invoice_num') ? null : o.inv || `INV-SIM-${seq}`
  const stax = missing.includes('supplier_tax_id') ? null : o.stax || '0105546011116'

  return {
    contract: PSTD.contract,
    message_id: `msg-20261007-${String(seq).padStart(4, '0')}`,
    sent_at: `2026-10-07T08:30:00+07:00`,
    source: {
      engine: 'system_a',
      engine_version: '3.0.4',
      standard_version: '6.7',
      validation_id: `VAL-${seq}`,
      result_sha256: 'a'.repeat(64)
    },
    document: {
      dms_doc_id: dms,
      file_sha256: 'b'.repeat(64),
      page_count: 2,
      uploaded_by: o.upl || 'SOMSAK.J',
      uploaded_at: '2026-10-07T08:00:00+07:00'
    },
    identity: {
      status: id,
      reason: res ? 'FOUND' : id === 'NOT_FOUND' ? 'RECEIPT_NOT_FOUND' : 'KEYS_UNREADABLE',
      receive_id: res ? o.rid : null,
      lookup_path: res ? 'TAX-INV' : null,
      missing_keys: missing
    },
    invoice: {
      invoice_num: inv,
      invoice_date: '2026-10-05',
      supplier_tax_id: stax,
      supplier_name: 'SUPPLIER CO., LTD.',
      customer_tax_id: ctax,
      po_numbers: pos,
      currency: 'THB',
      sub_total: sub,
      vat,
      grand_total: tot
    },
    receipt: res
      ? {
          receive_id: o.rid,
          org_id: o.org || 103,
          receiver: o.receiver || 'SOMSAK JAIDEE',
          po_received: pos.map((x: string) => ({ po_number: x, line_count: 1, amount: sub })),
          receipt_total: sub
        }
      : null,
    rules: [
      'V-01',
      'V-02',
      'V-03',
      'V-04',
      'V-05',
      'V-06',
      'V-07',
      'V-08',
      'V-09'
    ].map(v => ({
      rule_id: v,
      result: codes.length ? 'fail' : 'pass',
      exception_code: codes[0] || null
    })),
    decision: {
      recommendation: rec,
      max_severity: codes.length ? 'High' : 'None',
      exception_codes: codes
    }
  }
}

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<string>('new_ap')
  const [seq, setSeq] = useState<number>(1)
  const [payloadJson, setPayloadJson] = useState<string>(() => {
    const p = PRESETS[0].presets[0].getPayload?.() || {}
    return JSON.stringify(buildMockPayload(p, 1), null, 2)
  })
  const [recs, setRecs] = useState<SimRecord[]>([])
  const [logs, setLogs] = useState<SimLogEntry[]>([])
  const [seen, setSeen] = useState<Record<string, any>>({})
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null)
  const [trace, setTrace] = useState<SimTraceStep[]>([])
  const [lastAck, setLastAck] = useState<any>(null)
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null)
  const [activeTab, setActiveTab] = useState<'console' | 'recs' | 'log' | 'spec'>('console')

  const setPreset = useCallback(
    (presetId: string) => {
      setPresetState(presetId)
      for (const group of PRESETS) {
        const found = group.presets.find(p => p.id === presetId)
        if (found && found.getPayload) {
          const raw = found.getPayload()
          const nextSeq = seq + 1
          setSeq(nextSeq)
          const pl = buildMockPayload(raw, nextSeq)
          setPayloadJson(JSON.stringify(pl, null, 2))
          break
        }
      }
    },
    [seq]
  )

  const resetSandbox = useCallback(() => {
    setRecs([])
    setLogs([])
    setSeen({})
    setTrace([])
    setLastAck(null)
    setValidationReport(null)
    setSelectedRecId(null)
  }, [])

  const runSimulation = useCallback(
    (customPayload?: Record<string, unknown>): { ack: any; trace: SimTraceStep[] } => {
      let payloadObj: any
      try {
        payloadObj = customPayload || JSON.parse(payloadJson)
      } catch (e: any) {
        const errReport = { errors: ['JSON Syntax Error: ' + e.message], warnings: [] }
        setValidationReport(errReport)
        const tr: SimTraceStep[] = [{ name: 'JSON Parsing', status: 'bad', detail: e.message }]
        setTrace(tr)
        return { ack: { http: 400, result: 'BAD_JSON' }, trace: tr }
      }

      const v = validatePayload(payloadObj)
      setValidationReport(v)

      const steps: SimTraceStep[] = [
        {
          name: '1. ตรวจ Payload มาตรฐาน ' + PSTD.contract,
          status: v.errors.length ? 'bad' : v.warnings.length ? 'warn' : 'ok',
          detail: v.errors.length
            ? v.errors.join(' · ')
            : `ผ่านการตรวจสอบ (${v.warnings.length ? v.warnings.length + ' คำเตือน' : 'สมบูรณ์'})`
        }
      ]

      const nowTime = new Date().toTimeString().slice(0, 8)

      if (v.errors.length) {
        const ack = {
          http: 422,
          result: 'VALIDATION_FAILED',
          message_id: payloadObj?.message_id || null,
          errors: v.errors
        }
        steps.push({
          name: 'ผลการประมวลผล',
          status: 'bad',
          detail: 'ปฏิเสธ Payload · ไม่สร้างรายการ'
        })
        setTrace(steps)
        setLastAck(ack)
        setLogs(prev => [
          {
            t: nowTime,
            mid: payloadObj?.message_id || '—',
            http: 422,
            result: 'VALIDATION_FAILED',
            pid: '—',
            rule: '—',
            note: v.errors.join(' · ')
          },
          ...prev
        ])
        return { ack, trace: steps }
      }

      // Idempotency check
      const mid = payloadObj.message_id
      if (seen[mid]) {
        const ack = { ...seen[mid], http: 200, result: 'ALREADY_PROCESSED' }
        steps.push({
          name: '2. ตรวจ Idempotency (message_id)',
          status: 'warn',
          detail: `${mid} เคยประมวลผลแล้ว ตอบผลเดิม`
        })
        setTrace(steps)
        setLastAck(ack)
        return { ack, trace: steps }
      }

      // Determine Portal status
      const rec = payloadObj.decision?.recommendation
      const idStatus = payloadObj.identity?.status
      const baseStatus =
        idStatus === 'UNRESOLVED'
          ? 'Manual Review'
          : rec === 'AUTO_PASS'
          ? 'Auto-pass'
          : rec === 'REVIEW'
          ? 'Review'
          : rec === 'HOLD'
          ? 'Hold'
          : 'Manual Review'

      // Check duplicates
      const rid = payloadObj.identity?.receive_id
      const stax = payloadObj.invoice?.supplier_tax_id
      const inv = payloadObj.invoice?.invoice_num
      const existing = recs.filter(
        r => (rid && (r as any).rid === rid) || (stax && inv && r.stax === stax && r.inv === inv)
      )

      let rule = 'DR-07'
      let finalStatus: any = baseStatus
      let result = 'CREATED'

      if (!existing.length) {
        rule = 'DR-07'
        result = 'CREATED'
        steps.push({
          name: '3. ตรวจเอกสารซ้ำใน Portal',
          status: 'ok',
          detail: `ไม่พบคู่เทียบ → สร้างรายการใหม่ (${finalStatus})`
        })
      } else {
        const active = existing.filter(r => !CLOSED_ST.includes(r.status))
        if (!active.length) {
          rule = 'DR-05'
          result = 'CREATED'
          steps.push({
            name: '3. ตรวจเอกสารซ้ำใน Portal',
            status: 'ok',
            detail: `พบคู่เทียบแต่ปิดแล้ว → ไม่ใช้เทียบ สร้างรายการใหม่ (${finalStatus})`
          })
        } else {
          const target = active[0]
          if (AP_ST.includes(target.status)) {
            rule = 'DR-04'
            result = 'CREATED_AS_DUPLICATE'
            finalStatus = 'Duplicate'
            steps.push({
              name: '3. ตรวจเอกสารซ้ำใน Portal',
              status: 'bad',
              detail: `${target.doc} อยู่ในสถานะ ${target.status} แล้ว → ฉบับใหม่ Duplicate`
            })
          } else {
            const rNew = RANK[baseStatus] || 9
            const rOld = RANK[target.status] || 9
            if (rNew > rOld) {
              rule = 'DR-03'
              result = 'CREATED_AS_DUPLICATE'
              finalStatus = 'Duplicate'
              steps.push({
                name: '3. ตรวจเอกสารซ้ำใน Portal',
                status: 'bad',
                detail: `ฉบับใหม่แย่กว่า (${baseStatus} vs ${target.status}) → ฉบับใหม่ Duplicate`
              })
            } else {
              rule = rNew < rOld ? 'DR-01' : 'DR-02'
              result = 'CREATED_SUPERSEDES'
              steps.push({
                name: '3. ตรวจเอกสารซ้ำใน Portal',
                status: 'ok',
                detail: `ฉบับใหม่${rNew < rOld ? 'ดีกว่า' : 'เท่าเดิม'} → แทนที่ฉบับเดิม ${target.doc} (Superseded)`
              })
            }
          }
        }
      }

      const pid = `SIM-${payloadObj.document?.dms_doc_id || String(Date.now()).slice(-6)}`
      const ack = {
        http: 201,
        result,
        message_id: mid,
        portal_doc_id: pid,
        applied_rule: rule,
        status: finalStatus
      }

      setSeen(prev => ({ ...prev, [mid]: ack }))
      setLastAck(ack)
      setTrace(steps)

      const co = payloadObj.receipt?.org_id
        ? companyOfOrg(payloadObj.receipt.org_id)
        : companyOfTax(payloadObj.invoice?.customer_tax_id || '')

      const newRec: SimRecord = {
        doc: pid,
        company: co,
        vendor: payloadObj.invoice?.supplier_name || '—',
        stax: payloadObj.invoice?.supplier_tax_id || '—',
        inv: payloadObj.invoice?.invoice_num || '—',
        dt: payloadObj.invoice?.invoice_date || '2026-10-07',
        total: payloadObj.invoice?.grand_total || 0,
        po: (payloadObj.invoice?.po_numbers || [])[0],
        receiver: payloadObj.receipt?.receiver,
        receiverActive: !!payloadObj.receipt?.receiver,
        status: finalStatus,
        up: '2026-10-07',
        codes: payloadObj.decision?.exception_codes || [],
        unres: idStatus === 'UNRESOLVED'
      }
      ;(newRec as any).rid = rid

      setRecs(prev => [newRec, ...prev])
      setSelectedRecId(pid)
      setLogs(prev => [
        {
          t: nowTime,
          mid,
          http: 201,
          result,
          pid,
          rule,
          note: `สร้างรายการ ${pid} (${finalStatus})`
        },
        ...prev
      ])

      return { ack, trace: steps }
    },
    [payloadJson, seen, recs]
  )

  return (
    <SimContext.Provider
      value={{
        preset,
        setPreset,
        payloadJson,
        setPayloadJson,
        recs,
        logs,
        selectedRecId,
        setSelectedRecId,
        trace,
        lastAck,
        validationReport,
        runSimulation,
        resetSandbox,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </SimContext.Provider>
  )
}

export function useSim() {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSim must be used within SimProvider')
  return ctx
}
