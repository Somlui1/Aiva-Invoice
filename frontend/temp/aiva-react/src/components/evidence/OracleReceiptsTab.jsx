import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Icon } from '../common/Icon.jsx';

export function OracleReceiptsTab({ doc }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadReceipts() {
      if (!doc?.doc) return;
      setLoading(true);
      const data = await api.getOracleReceipts(doc.doc);
      if (active) {
        setReceipts(data || []);
        setLoading(false);
      }
    }
    loadReceipts();
    return () => { active = false; };
  }, [doc]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูลใบรับสินค้า Oracle...</div>;
  }

  const invoiceAmount = doc?.sub || doc?.total || 0;
  const receiptTotal = receipts.reduce((sum, r) => sum + (r.amount || (r.qty * r.unitPrice) || 0), 0);
  const variance = Math.abs(invoiceAmount - receiptTotal);
  const isMatch = variance < 0.01;

  return (
    <div className="oracle-receipts-tab" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: 'var(--bg-panel)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยอดเงินใบกำกับภาษี</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            {invoiceAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ยอดรับสินค้าใน Oracle (PO)</div>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            {receiptTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ผลการกระทบยอด (Diff)</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: isMatch ? 'var(--color-pass, #10b981)' : 'var(--color-warn, #f59e0b)' }}>
            {isMatch ? '✓ ตรงกัน (0.00)' : `Δ ${variance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="tbl" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>เลขที่ PO</th>
              <th>เลขที่ใบรับสินค้า (Receipt #)</th>
              <th style={{ textAlign: 'center' }}>ลำดับ</th>
              <th style={{ textAlign: 'right' }}>จำนวนที่รับ</th>
              <th style={{ textAlign: 'right' }}>ราคาต่อหน่วย</th>
              <th style={{ textAlign: 'right' }}>ยอดเงิน (THB)</th>
              <th style={{ textAlign: 'center' }}>สถานะรับ</th>
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  ไม่พบรายการรับสินค้า PO ในระบบ Oracle สำหรับเอกสารนี้
                </td>
              </tr>
            ) : (
              receipts.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.poNumber || doc.po || '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{r.receiptNum || r.rcvLineId || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{r.lineNo || idx + 1}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.qty != null ? r.qty : 1}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {r.unitPrice != null ? r.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    {(r.amount || (r.qty * r.unitPrice) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="pill p-pass" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                      MATCHED
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OracleReceiptsTab;
