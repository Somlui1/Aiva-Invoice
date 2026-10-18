import React, { useState } from 'react';
import { useInvoices } from '../../context/InvoiceContext.jsx';
import { OracleReceiptsTab } from './OracleReceiptsTab.jsx';
import { getStatusBadge } from '../queue/QueueTable.jsx';
import { Icon } from '../common/Icon.jsx';

export function InvoiceDetailPane() {
  const { selectedDoc } = useInvoices();
  const [activeTab, setActiveTab] = useState('rules'); // rules | lines | oracle | json

  if (!selectedDoc) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        เลือกเอกสารเพื่อดูข้อมูลการตรวจสอบ
      </div>
    );
  }

  const badge = getStatusBadge(selectedDoc.status);
  const rules = selectedDoc.rules || [
    { id: 'V-01', name: 'ความสมบูรณ์ของหัวเอกสาร (Header Completeness)', status: 'PASS' },
    { id: 'V-02', name: 'ข้อมูลผู้ขายและเลขประจำตัวผู้เสียภาษี (Supplier & Tax ID)', status: 'PASS' },
    { id: 'V-03', name: 'ข้อมูลผู้ซื้อและสาขา (Customer & Aapico Legal Entity)', status: 'PASS' },
    { id: 'V-04', name: 'ความถูกต้องทางคณิตศาสตร์ (Subtotal, VAT, Grand Total)', status: 'PASS' },
    { id: 'V-05', name: 'ที่อยู่ผู้ซื้อและผู้ขาย (Address Validation)', status: 'PASS' },
    { id: 'V-06', name: 'ลายมือชื่อผู้ส่งและผู้รับสินค้า (Signatures)', status: 'PASS' },
    { id: 'V-07', name: 'รายการสินค้าเทียบใบสั่งซื้อ (Line Items Matching)', status: 'PASS' },
    { id: 'V-08', name: 'หน่วยนับและจำนวนสินค้า (Quantity & UOM Validation)', status: 'PASS' }
  ];

  return (
    <div className="invoice-detail-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
      {/* Header Info */}
      <div className="detail-header" style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace' }}>{selectedDoc.doc}</span>
            <span className="co-pill" style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--chip-bg, #333)', fontSize: '12px' }}>
              {selectedDoc.company}
            </span>
          </div>
          <span className={badge.className} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px', borderRadius: '12px' }}>
            <Icon name={badge.icon} size={14} />
            {badge.label}
          </span>
        </div>

        <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedDoc.vendor}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>เลขที่: <b>{selectedDoc.inv || '-'}</b></span>
          <span>วันที่: <b>{selectedDoc.dt || '-'}</b></span>
          <span>PO: <b>{selectedDoc.po || '-'}</b></span>
          <span>ยอดรวม: <b style={{ color: 'var(--color-pass, #10b981)' }}>{typeof selectedDoc.total === 'number' ? selectedDoc.total.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : selectedDoc.total} THB</b></span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="detail-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-canvas, #1e1e24)', padding: '0 8px' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '10px 14px',
            borderBottom: activeTab === 'rules' ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
            color: activeTab === 'rules' ? 'var(--primary, #3b82f6)' : 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          ผลการตรวจสอบ (Rules)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'lines' ? 'active' : ''}`}
          onClick={() => setActiveTab('lines')}
          style={{
            padding: '10px 14px',
            borderBottom: activeTab === 'lines' ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
            color: activeTab === 'lines' ? 'var(--primary, #3b82f6)' : 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          รายการสินค้า (Lines)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'oracle' ? 'active' : ''}`}
          onClick={() => setActiveTab('oracle')}
          style={{
            padding: '10px 14px',
            borderBottom: activeTab === 'oracle' ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
            color: activeTab === 'oracle' ? 'var(--primary, #3b82f6)' : 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          Oracle Receipts
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
          onClick={() => setActiveTab('json')}
          style={{
            padding: '10px 14px',
            borderBottom: activeTab === 'json' ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
            color: activeTab === 'json' ? 'var(--primary, #3b82f6)' : 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer'
          }}
        >
          Raw JSON
        </button>
      </div>

      {/* Tab Contents */}
      <div className="detail-tab-body" style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        {activeTab === 'rules' && (
          <div className="rules-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rules.map((r, i) => {
              const isPass = r.status === 'PASS';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-canvas)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary, #3b82f6)' }}>{r.id}</span>
                    <span style={{ fontSize: '13px' }}>{r.name || r.desc}</span>
                  </div>
                  <span
                    className={isPass ? 'pill p-pass' : 'pill p-bad'}
                    style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}
                  >
                    {r.status || 'PASS'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'lines' && (
          <div className="lines-list">
            <table className="tbl" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>รายละเอียดสินค้า</th>
                  <th style={{ textAlign: 'right', width: '70px' }}>จำนวน</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>ราคา/หน่วย</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>ยอดรวม</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{selectedDoc.line_desc || `สินค้าตามใบกำกับภาษี ${selectedDoc.inv}`}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>1.00</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {selectedDoc.sub ? selectedDoc.sub.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedDoc.sub ? selectedDoc.sub.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'oracle' && (
          <OracleReceiptsTab doc={selectedDoc} />
        )}

        {activeTab === 'json' && (
          <pre style={{ margin: 0, padding: '12px', background: 'var(--bg-canvas)', borderRadius: '6px', fontSize: '11px', overflowX: 'auto', border: '1px solid var(--border)' }}>
            {JSON.stringify(selectedDoc, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default InvoiceDetailPane;
