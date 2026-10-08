'use client'

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

export function PortalShell({ initialPage = 'queue' }: { initialPage?: PageKey }) {
  const { currentUser } = useAuth()
  const { isEvidenceDockOpen, closeEvidenceDock } = useInvoices()
  const [currentPage, setCurrentPage] = useState<PageKey>(initialPage)
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem('aiva.nav') === 'c'
    } catch {
      return false
    }
  })

  // Switch default page if ADM (has scope 'none') and no specific initialPage was given
  useEffect(() => {
    if (initialPage === 'queue' && currentUser.role === 'ADM') {
      setCurrentPage('rbac')
    }
  }, [currentUser.id, currentUser.role, initialPage])

  const handleNavigate = (page: PageKey) => {
    setCurrentPage(page)
    try {
      if (typeof window !== 'undefined') {
        const targetUrl = page === 'queue' ? '/' : `/${page}`
        window.history.pushState(null, '', targetUrl)
      }
    } catch {}
  }

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
          onNavigate={handleNavigate}
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

export function App({ initialPage = 'queue' }: { initialPage?: PageKey }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>
              <PortalShell initialPage={initialPage} />
            </SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
