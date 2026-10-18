import React from 'react';
import { MENU_CONFIG } from './menuConfig.js';
import { Icon } from '../common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInvoices } from '../../context/InvoiceContext.jsx';

export function Sidebar({ currentPage = 'queue', onNavigate = () => {} }) {
  const { currentUser, can } = useAuth();
  const { visibleDocs, docs } = useInvoices();

  const isEu = currentUser?.role === 'EU';

  const getBadgeCount = (itemKey) => {
    if (itemKey === 'queue') {
      return visibleDocs.length;
    }
    if (itemKey === 'cases') {
      return docs.length;
    }
    return null;
  };

  return (
    <aside className="nav" aria-label="เมนูหลัก">
      <div className="nav-org">
        <span className="brand-tile">
          <span className="logo-mark" role="img" aria-label="AIVA"></span>
        </span>
        <div className="tx">
          <b>AIVA</b>
          <span>Auto Invoice Matching</span>
        </div>
      </div>

      <nav className="nav-list" id="navlist">
        {MENU_CONFIG.map((sec, secIdx) => (
          <div key={secIdx} className="nav-section-group">
            <div className={`nav-sec ${sec.isSpecial ? 'sp' : ''}`}>
              {sec.title}
            </div>
            {sec.items.map(item => {
              const allowed = item.action ? can(item.action) : true;
              const isActive = currentPage === item.key;
              const badge = getBadgeCount(item.key);
              const label = isEu && item.key === 'queue' ? 'งานของฉัน' : item.label;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`nav-it ${item.key === 'sim' ? 'sim' : ''} ${isActive ? 'on' : ''} ${allowed ? '' : 'dis'} ${badge ? 'has-cnt' : ''}`}
                  title={`${label}${allowed ? '' : ' (ไม่มีสิทธิ์)'}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    if (allowed) onNavigate(item.key);
                  }}
                >
                  <Icon name={item.icon} size={20} className="ico" />
                  <span className="lbl">{label}</span>
                  {!allowed && <span className="lock"><Icon name="lock" size={14} /></span>}
                  {item.tag && <span className={item.tag === 'SIM' ? 'tagsim' : 'tagdev'}>{item.tag}</span>}
                  {badge !== null && <span className="cnt">{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="nav-foot">
        <span className="lbl grow">
          <b>Standard</b> v6.6 · Engine v5.5
        </span>
      </div>
    </aside>
  );
}

export default Sidebar;
