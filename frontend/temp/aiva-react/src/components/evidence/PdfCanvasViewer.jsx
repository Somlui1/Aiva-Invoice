import React, { useState } from 'react';
import { useInvoices } from '../../context/InvoiceContext.jsx';
import { Icon } from '../common/Icon.jsx';

export function normalizeBBox(bbox) {
  if (!bbox || !Array.isArray(bbox) || bbox.length < 4) return null;
  let [ymin, xmin, ymax, xmax] = bbox;
  
  if (ymin > 1 || xmin > 1 || ymax > 1 || xmax > 1) {
    ymin /= 1000;
    xmin /= 1000;
    ymax /= 1000;
    xmax /= 1000;
  }
  
  const top = (ymin * 100).toFixed(2) + '%';
  const left = (xmin * 100).toFixed(2) + '%';
  const width = Math.max(0, (xmax - xmin) * 100).toFixed(2) + '%';
  const height = Math.max(0, (ymax - ymin) * 100).toFixed(2) + '%';
  
  return { top, left, width, height };
}

export function PdfCanvasViewer() {
  const { selectedDoc } = useInvoices();
  const [zoom, setZoom] = useState(100);
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!selectedDoc) {
    return (
      <div className="pdf-viewer-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        เลือกเอกสารจากคิวเพื่อดูภาพและพิกัด BBox
      </div>
    );
  }

  // Extract key field bboxes if present on document
  const bboxes = [
    {
      field: 'เลขที่ใบกำกับ (Invoice No)',
      val: selectedDoc.inv,
      box: selectedDoc.bbox_inv || [80, 680, 115, 920],
      color: 'rgba(168, 85, 247, 0.9)',
      bg: 'rgba(168, 85, 247, 0.15)'
    },
    {
      field: 'วันที่ (Invoice Date)',
      val: selectedDoc.dt,
      box: selectedDoc.bbox_date || [120, 680, 145, 880],
      color: 'rgba(59, 130, 246, 0.9)',
      bg: 'rgba(59, 130, 246, 0.15)'
    },
    {
      field: 'ผู้ขาย (Supplier Name)',
      val: selectedDoc.vendor,
      box: selectedDoc.bbox_vendor || [70, 80, 110, 520],
      color: 'rgba(14, 165, 233, 0.9)',
      bg: 'rgba(14, 165, 233, 0.15)'
    },
    {
      field: 'เลขประจำตัวผู้เสียภาษี (Tax ID)',
      val: selectedDoc.stax,
      box: selectedDoc.bbox_tax || [115, 80, 140, 320],
      color: 'rgba(20, 184, 166, 0.9)',
      bg: 'rgba(20, 184, 166, 0.15)'
    },
    {
      field: 'ยอดสุทธิ (Grand Total)',
      val: typeof selectedDoc.total === 'number' ? selectedDoc.total.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : selectedDoc.total,
      box: selectedDoc.bbox_total || [840, 720, 880, 930],
      color: 'rgba(16, 185, 129, 0.95)',
      bg: 'rgba(16, 185, 129, 0.2)'
    }
  ];

  return (
    <div className="pdf-canvas-viewer" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-canvas, #18191c)', borderLeft: '1px solid var(--border)' }}>
      {/* Viewer Toolbar */}
      <div className="viewer-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>{selectedDoc.doc}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>· หน้า 1/1</span>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="ibtn"
            onClick={() => setZoom(z => Math.max(50, z - 15))}
            title="ย่อขนาด"
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            -
          </button>
          <span style={{ fontSize: '12px', minWidth: '42px', textAlign: 'center' }}>{zoom}%</span>
          <button
            type="button"
            className="ibtn"
            onClick={() => setZoom(z => Math.min(200, z + 15))}
            title="ขยายขนาด"
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            +
          </button>
          <button
            type="button"
            className="ibtn"
            onClick={() => setZoom(100)}
            title="รีเซ็ตขนาด 100%"
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11px' }}
          >
            Fit
          </button>
        </div>

        {/* Overlay toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showOverlays}
            onChange={(e) => setShowOverlays(e.target.checked)}
          />
          <span>BBox Overlays</span>
        </label>
      </div>

      {/* Document Viewport */}
      <div className="viewer-viewport" style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div
          className="document-page"
          style={{
            position: 'relative',
            width: `${(600 * zoom) / 100}px`,
            minHeight: `${(850 * zoom) / 100}px`,
            background: '#ffffff',
            color: '#111827',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            borderRadius: '4px',
            padding: '24px',
            fontSize: `${(11 * zoom) / 100}px`,
            transition: 'width 0.15s ease, min-height 0.15s ease',
            userSelect: 'none'
          }}
        >
          {/* Authentic Invoice Simulation Paper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedDoc.vendor}</div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>เลขประจำตัวผู้เสียภาษี: {selectedDoc.stax}</div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>สำนักงานใหญ่ · โทรศัพท์: 02-XXX-XXXX</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1f2937' }}>ใบกำกับภาษี / ใบเสร็จรับเงิน</div>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>เลขที่: {selectedDoc.inv}</div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>วันที่: {selectedDoc.dt}</div>
            </div>
          </div>

          <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151' }}>ลูกค้า: {selectedDoc.oname || 'บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)'}</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>PO อ้างอิง: {selectedDoc.po || '-'} · รหัสสาขา: {selectedDoc.org || '101'}</div>
          </div>

          {/* Table simulation */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 80px 90px', background: '#f3f4f6', fontWeight: 700, padding: '6px 8px', fontSize: '10px', borderBottom: '1px solid #e5e7eb' }}>
              <div>ลำดับ</div>
              <div>รายการ / Description</div>
              <div style={{ textAlign: 'right' }}>จำนวน</div>
              <div style={{ textAlign: 'right' }}>หน่วยละ</div>
              <div style={{ textAlign: 'right' }}>จำนวนเงิน</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 80px 90px', padding: '6px 8px', fontSize: '10px', borderBottom: '1px dashed #e5e7eb' }}>
              <div>1</div>
              <div>ค่าสินค้า / ค่าบริการตามใบสั่งซื้อ {selectedDoc.po}</div>
              <div style={{ textAlign: 'right' }}>1.00</div>
              <div style={{ textAlign: 'right' }}>{selectedDoc.sub ? selectedDoc.sub.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</div>
              <div style={{ textAlign: 'right' }}>{selectedDoc.sub ? selectedDoc.sub.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</div>
            </div>
          </div>

          {/* Total summary box */}
          <div style={{ marginLeft: 'auto', width: '220px', fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', background: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>มูลค่าสินค้า (Subtotal):</span>
              <span style={{ fontWeight: 600 }}>{selectedDoc.sub ? selectedDoc.sub.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
              <span style={{ fontWeight: 600 }}>{selectedDoc.vat ? selectedDoc.vat.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d1d5db', paddingTop: '4px', fontWeight: 700, fontSize: '12px', color: '#047857' }}>
              <span>ยอดเงินรวม (Grand Total):</span>
              <span>{typeof selectedDoc.total === 'number' ? selectedDoc.total.toLocaleString('th-TH', { minimumFractionDigits: 2 }) : selectedDoc.total} THB</span>
            </div>
          </div>

          {/* BBox Overlay Layer */}
          {showOverlays && (
            <div className="bbox-overlay-layer" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              {bboxes.map((item, idx) => {
                const css = normalizeBBox(item.box);
                if (!css) return null;
                const isHovered = activeTooltip === idx;

                return (
                  <div
                    key={idx}
                    className="bbox-rect"
                    style={{
                      position: 'absolute',
                      top: css.top,
                      left: css.left,
                      width: css.width,
                      height: css.height,
                      border: `2px solid ${item.color}`,
                      backgroundColor: isHovered ? item.bg : 'rgba(0,0,0,0.02)',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={() => setActiveTooltip(idx)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    {/* Field Pill Label */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: 0,
                        background: item.color,
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      {item.field.split(' ')[0]}
                    </span>

                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%) translateY(-6px)',
                          background: '#1f2937',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          whiteSpace: 'nowrap',
                          zIndex: 50,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          border: '1px solid #374151'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#93c5fd' }}>{item.field}</div>
                        <div>{item.val}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PdfCanvasViewer;
