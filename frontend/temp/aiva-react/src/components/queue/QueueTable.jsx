import React from 'react';
import { useInvoices } from '../../context/InvoiceContext.jsx';
import { Icon } from '../common/Icon.jsx';

export function getStatusBadge(status) {
  switch (status) {
    case 'Auto-pass':
    case 'Posted':
      return { label: status, className: 'pill p-pass', icon: 'check' };
    case 'Review':
      return { label: status, className: 'pill p-warn', icon: 'alert' };
    case 'Hold':
      return { label: status, className: 'pill p-hold', icon: 'lock' };
    case 'Manual Review':
    case 'Rejected':
      return { label: status, className: 'pill p-bad', icon: 'cross' };
    default:
      return { label: status || 'Unknown', className: 'pill', icon: 'inbox' };
  }
}

export function QueueTable() {
  const { visibleDocs, selectedDocId, selectDoc } = useInvoices();

  const formatCurrency = (val) => {
    if (typeof val !== 'number') return '-';
    return val.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="table-wrap" style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
      <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '90px' }}>รหัสเอกสาร</th>
            <th style={{ width: '60px' }}>บ.</th>
            <th>เลขที่ใบกำกับ</th>
            <th style={{ width: '100px' }}>วันที่</th>
            <th>ผู้ขาย / คู่ค้า</th>
            <th>PO Number</th>
            <th style={{ textAlign: 'right', width: '120px' }}>ยอดรวม (THB)</th>
            <th style={{ textAlign: 'center', width: '120px' }}>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {visibleDocs.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                ไม่พบเอกสารที่ตรงกับเงื่อนไขการค้นหา
              </td>
            </tr>
          ) : (
            visibleDocs.map(doc => {
              const isSelected = doc.doc === selectedDocId;
              const badge = getStatusBadge(doc.status);

              return (
                <tr
                  key={doc.doc}
                  onClick={() => selectDoc(doc.doc)}
                  className={isSelected ? 'on' : ''}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-active, rgba(59, 130, 246, 0.12))' : undefined,
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{doc.doc}</td>
                  <td>
                    <span className="co-pill" style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--chip-bg, #333)', fontSize: '11px' }}>
                      {doc.company}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{doc.inv || '-'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{doc.dt || '-'}</td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.vendor}>
                    {doc.vendor}
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{doc.po || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                    {formatCurrency(doc.total)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={badge.className} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '12px' }}>
                      <Icon name={badge.icon} size={12} />
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default QueueTable;
