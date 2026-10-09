'use client'

import type { ReactNode } from 'react'
import { InvoiceDoc } from '../../types/invoice'
import { VENDOR_PROFILES } from '../../mock/vendors'
import { COMPANIES } from '../../mock/companies'

interface EvidenceCanvasProps {
  doc: InvoiceDoc
  pageNumber: number
  scale?: number
  /**
   * Receives the page element so the dock can measure the `data-k` / `data-line`
   * regions into normalised bboxes (`useMeasuredRegions`).
   */
  onPageElement?: (el: HTMLDivElement | null) => void
  /** Evidence boxes, positioned in this page's coordinate frame. */
  overlay?: ReactNode
}

function seedR(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function renderSignatureSvg(seed: string, color = '#1e3a8a') {
  const r = seedR(seed)
  let x = 14
  let p = `M ${x} ${32 + r() * 8}`
  for (let i = 0; i < 5; i++) {
    x += 16 + r() * 12
    p += ` C ${x - 12} ${4 + r() * 14}, ${x - 6} ${48 + r() * 8}, ${x} ${18 + r() * 18}`
  }
  p += ` M ${10 + r() * 12} ${40 + r() * 6} Q ${x / 2} ${30 + r() * 12} ${x + 10} ${26 + r() * 8}`

  return (
    <svg className="sigsvg" viewBox={`0 0 ${Math.round(x + 24)} 60`} aria-hidden="true">
      <path
        d={p}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EvidenceCanvas({ doc, pageNumber, onPageElement, overlay }: EvidenceCanvasProps) {
  const vendor = VENDOR_PROFILES[doc.stax] || {
    th: doc.vendor,
    ad: '—',
    tel: '-',
    fax: '-',
    lg: 'V',
    acc: '#334155',
    st: 'digital'
  }

  const isOriginal = pageNumber === 1
  const kind = isOriginal ? 'inv' : pageNumber === 2 ? 'copy' : 'terms'

  return (
    <div className="evd-page" ref={onPageElement}>
      <div className="ivp-paper">
        {/* Header */}
        <div className="iv-head">
          <div className="iv-sup" data-k="supplier">
            <div className="iv-logo" style={{ background: vendor.acc }}>
              {vendor.lg}
            </div>
            <div>
              <b>{vendor.th}</b>
              <div className="en">{doc.vendor.toUpperCase()}</div>
              <div className="ad">{vendor.ad}</div>
              <div className="ad">โทร. {vendor.tel}</div>
              <div className="ad">
                เลขประจำตัวผู้เสียภาษีอากร <b className="m">{doc.stax}</b>
              </div>
            </div>
          </div>

          <div className="iv-title" data-k="header">
            <div className="t1" style={{ color: vendor.acc }}>
              {kind === 'copy'
                ? 'ใบส่งของ'
                : kind === 'terms'
                ? 'เงื่อนไขการขาย'
                : 'ใบกำกับภาษี / ใบแจ้งหนี้'}
            </div>
            <div className="t2">
              {kind === 'copy'
                ? 'DELIVERY ORDER'
                : kind === 'terms'
                ? 'TERMS & CONDITIONS'
                : 'TAX INVOICE / INVOICE'}
            </div>
            <div className={`orig ${kind === 'inv' ? '' : 'cp'}`}>
              {kind === 'inv' ? 'ต้นฉบับ (ORIGINAL)' : 'สำเนา (COPY)'}
            </div>
            <table className="iv-kv">
              <tbody>
                <tr>
                  <td>เลขที่ / No.</td>
                  <td>{doc.inv}</td>
                </tr>
                <tr>
                  <td>วันที่ / Date</td>
                  <td>{doc.dt}</td>
                </tr>
                <tr>
                  <td>หน้า / Page</td>
                  <td>
                    {pageNumber} / {doc.pages}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Box */}
        <div className="iv-row" style={{ marginTop: 10 }}>
          <div className="iv-box" data-k="customer">
            <div className="lbl">ลูกค้า / Customer</div>
            <b>บริษัท {COMPANIES[doc.company]?.name || 'อาปิโก ไฮเทค จำกัด (มหาชน)'}</b>
            <div className="ad">
              Tax ID: <b className="mono">{COMPANIES[doc.company]?.tax || doc.stax}</b>
            </div>
          </div>
          <div className="iv-box iv-ref" data-k="po">
            <div className="lbl">อ้างอิง / Reference</div>
            <table>
              <tbody>
                <tr>
                  <td>PO No.</td>
                  <td className="mono">{doc.po}</td>
                </tr>
                <tr>
                  <td>Release</td>
                  <td className="mono">{doc.release ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="iv-lines" data-k="lines" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th style={{ width: 32 }}>#</th>
              <th>รายการสินค้า / Description</th>
              <th style={{ width: 64 }}>จำนวน</th>
              <th style={{ width: 50 }}>หน่วย</th>
              <th style={{ width: 75 }}>หน่วยละ</th>
              <th style={{ width: 85 }}>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {(doc.lines || []).map((l, i) => (
              <tr key={i} data-line={l.no ?? i + 1}>
                <td className="c">{i + 1}</td>
                <td>{l.desc}</td>
                <td className="n">{l.qty}</td>
                <td className="c">{l.unit}</td>
                <td className="n">{l.price.toLocaleString()}</td>
                <td className="n">{l.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Footer */}
        <div className="iv-foot" style={{ marginTop: 10 }}>
          <div className="iv-words">
            <div className="lbl">หมายเหตุ</div>
            <div className="iv-note">ชำระเงินตามเงื่อนไขเครดิต 30 วัน</div>
          </div>
          <table className="iv-tot" data-k="totals">
            <tbody>
              <tr>
                <td>ยอดรวมก่อนภาษี</td>
                <td>{(doc.sub || Math.round(doc.total / 1.07)).toLocaleString()}</td>
              </tr>
              <tr>
                <td>ภาษีมูลค่าเพิ่ม 7%</td>
                <td>{(doc.vat || Math.round(doc.total - (doc.sub || Math.round(doc.total / 1.07)))).toLocaleString()}</td>
              </tr>
              <tr>
                <td>ยอดรวมสุทธิ</td>
                <td className="mono">{doc.total.toLocaleString()} ฿</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="iv-sigs" data-k="signatures" style={{ marginTop: 16 }}>
          <div className="iv-sig" data-k="sig_sup">
            <div className="ln">
              {doc.sig?.[0] ? renderSignatureSvg(doc.inv + '-sup') : null}
            </div>
            <div>ผู้ส่งของ / ผู้มีอำนาจลงนาม</div>
          </div>
          <div className="iv-sig" data-k="sig_rcv">
            <div className="ln">
              {doc.sig?.[1] ? renderSignatureSvg(doc.inv + '-rcv') : null}
            </div>
            <div>ผู้รับสินค้า / บริการ</div>
          </div>
          <div className="iv-sig">
            <div className="ln" />
            <div>ผู้ตรวจสอบบัญชี</div>
          </div>
        </div>

        {/* Footer Page Number */}
        <div className="iv-pf" style={{ marginTop: 12 }}>
          <span>F-AC-01 Rev.03 · {vendor.lg}</span>
          <span>เอกสารจำลองเพื่อการตรวจสอบ AIVA</span>
          <span>
            หน้า {pageNumber}/{doc.pages}
          </span>
        </div>
      </div>
      {overlay}
    </div>
  )
}

export default EvidenceCanvas
