import React from 'react';
import { useInvoices } from '../../context/InvoiceContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { QueueTable } from './QueueTable.jsx';
import { Icon } from '../common/Icon.jsx';

export function QueuePage() {
  const { currentUser } = useAuth();
  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery, stats, visibleDocs } = useInvoices();

  const filterChips = [
    { key: 'all', label: 'ทั้งหมด', count: stats.total },
    { key: 'Review', label: 'Review', count: stats.review },
    { key: 'Hold', label: 'Hold', count: stats.hold },
    { key: 'Auto-pass', label: 'Auto-pass', count: stats.autoPass },
    { key: 'Manual Review', label: 'Manual Review', count: stats.manualReview }
  ];

  if (currentUser?.role === 'EU') {
    filterChips.splice(1, 0, { key: 'mine', label: 'งานของฉัน', count: null });
  }

  return (
    <div className="queue-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Metric Bar */}
      <div className="metric-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div className="card metric-card" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>เอกสารทั้งหมด</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div className="card metric-card" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-warn, #f59e0b)' }}>ต้องตรวจสอบ (Review)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-warn, #f59e0b)' }}>{stats.review}</div>
        </div>
        <div className="card metric-card" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-hold, #ec4899)' }}>พักการจ่าย (Hold)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-hold, #ec4899)' }}>{stats.hold}</div>
        </div>
        <div className="card metric-card" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-pass, #10b981)' }}>ผ่านอัตโนมัติ (Auto-pass)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-pass, #10b981)' }}>{stats.autoPass}</div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="ctrl-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Status Chips */}
        <div className="chips" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filterChips.map(chip => (
            <button
              key={chip.key}
              type="button"
              className={`chip ${statusFilter === chip.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(chip.key)}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                background: statusFilter === chip.key ? 'var(--primary, #3b82f6)' : 'var(--bg-panel)',
                color: statusFilter === chip.key ? '#fff' : 'inherit',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              <span>{chip.label}</span>
              {chip.count !== null && (
                <span style={{
                  background: statusFilter === chip.key ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '11px'
                }}>
                  {chip.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="search-wrap" style={{ position: 'relative', width: '280px' }}>
          <Icon name="search" size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาเลขที่, ผู้ขาย, PO…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-panel)',
              color: 'inherit',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Main Table */}
      <QueueTable />
    </div>
  );
}

export default QueuePage;
