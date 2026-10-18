import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { InvoiceProvider } from './context/InvoiceContext.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { QueuePage } from './components/queue/QueuePage.jsx';
import { PdfCanvasViewer } from './components/evidence/PdfCanvasViewer.jsx';
import { InvoiceDetailPane } from './components/evidence/InvoiceDetailPane.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import ModalHost from './components/ModalHost.jsx';
import ToastHost from './components/ToastHost.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('queue');

  return (
    <AuthProvider>
      <ThemeProvider>
        <InvoiceProvider>
          <SplashScreen />
          <AppShell currentPage={currentPage} onNavigate={setCurrentPage}>
            {currentPage === 'queue' ? (
              <div
                className="qview-split-layout"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(450px, 1fr) minmax(480px, 1.15fr)',
                  height: 'calc(100vh - var(--topbar-h, 54px))',
                  overflow: 'hidden'
                }}
              >
                {/* Left Queue Panel */}
                <div style={{ overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                  <QueuePage />
                </div>

                {/* Right Evidence & Details Dock */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: '1.2fr 1fr',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ overflow: 'hidden', height: '100%' }}>
                    <PdfCanvasViewer />
                  </div>
                  <div style={{ overflow: 'hidden', height: '100%' }}>
                    <InvoiceDetailPane />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  หน้า: {currentPage.toUpperCase()}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                  เมนูนี้กำลังอยู่ในระหว่างการพัฒนาและเชื่อมต่อข้อมูลในรอบถัดไป
                </p>
                <button
                  type="button"
                  className="ibtn"
                  onClick={() => setCurrentPage('queue')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    background: 'var(--primary, #3b82f6)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  กลับสู่หน้าคิวตรวจสอบ (Queue)
                </button>
              </div>
            )}
          </AppShell>
          <ModalHost />
          <ToastHost />
        </InvoiceProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
