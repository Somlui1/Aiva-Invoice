import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastModalProvider } from './context/ToastModalContext'
import { InvoiceProvider, useInvoices } from './context/InvoiceContext'
import { SimProvider } from './context/SimContext'
import { Topbar } from './components/layout/Topbar'
import { Sidebar, PageKey } from './components/layout/Sidebar'
import { Modal } from './components/layout/Modal'
import { Toast } from './components/layout/Toast'
import { QueuePage } from './components/queue/QueuePage'
import { ApPage } from './components/governance/ApPage'
import { RbacPage } from './components/governance/RbacPage'
import { CasesPage } from './components/governance/CasesPage'
import { AuditPage } from './components/governance/AuditPage'
import { SettingsPage } from './components/governance/SettingsPage'
import { StdPage } from './components/governance/StdPage'
import { SimPage } from './components/governance/SimPage'

function PortalShell() {
  const { currentUser } = useAuth()
  const { isEvidenceDockOpen, closeEvidenceDock } = useInvoices()
  const [currentPage, setCurrentPage] = useState<PageKey>('queue')
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('aiva.nav') === 'c'
    } catch {
      return false
    }
  })

  // Switch default page if ADM (has scope 'none')
  useEffect(() => {
    if (currentUser.role === 'ADM') {
      setCurrentPage('rbac')
    } else {
      setCurrentPage('queue')
    }
  }, [currentUser.id, currentUser.role])

  const toggleNav = () => {
    setIsNavCollapsed(prev => {
      const next = !prev
      try {
        window.localStorage.setItem('aiva.nav', next ? 'c' : 'e')
      } catch {}
      return next
    })
  }

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return
      }
      if (e.key === '[') {
        e.preventDefault()
        toggleNav()
      } else if (e.key === 'Escape' && isEvidenceDockOpen) {
        e.preventDefault()
        closeEvidenceDock()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEvidenceDockOpen, closeEvidenceDock])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'queue':
        return <QueuePage />
      case 'ap':
        return <ApPage />
      case 'rbac':
        return <RbacPage />
      case 'cases':
        return <CasesPage />
      case 'audit':
        return <AuditPage />
      case 'settings':
        return <SettingsPage />
      case 'std':
        return <StdPage />
      case 'sim':
        return <SimPage />
      default:
        return <QueuePage />
    }
  }

  return (
    <div className={`shell ${isNavCollapsed ? 'nav-c' : ''}`} id="shell">
      <Topbar isNavCollapsed={isNavCollapsed} onToggleNav={toggleNav} />
      <div className="body">
        <Sidebar
          currentPage={currentPage}
          onNavigate={page => setCurrentPage(page)}
          onToggleNav={toggleNav}
        />
        <main className="main" id="app">
          {renderCurrentPage()}
        </main>
      </div>
      <Modal />
      <Toast />
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>
              <PortalShell />
            </SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
