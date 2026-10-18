'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useInvoices } from '@/context/InvoiceContext'
import { Topbar } from './Topbar'
import { Sidebar, PageKey } from './Sidebar'
import { Modal } from './Modal'
import { Toast } from './Toast'
import { QueuePage } from '../queue/QueuePage'
import { ApPage } from '../governance/ApPage'
import { RbacPage } from '../governance/RbacPage'
import { CasesPage } from '../governance/CasesPage'
import { AuditPage } from '../governance/AuditPage'
import { SettingsPage } from '../governance/SettingsPage'
import { StdPage } from '../governance/StdPage'
import { SimPage } from '../governance/SimPage'
import { DocumentAlertHost } from '@/features/notifications/DocumentAlertHost'
import { SplashScreen } from './SplashScreen'
import { CommandPalette } from './CommandPalette'

export function PortalShell({ initialPage = 'queue' }: { initialPage?: PageKey }) {
  const { currentUser, isAuthenticated } = useAuth()
  const { isEvidenceDockOpen, closeEvidenceDock } = useInvoices()
  const [currentPage, setCurrentPage] = useState<PageKey>(initialPage)
  const [isCmdkOpen, setIsCmdkOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false)

  // Sync nav collapse preference from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem('aiva.nav') === 'c') {
        setIsNavCollapsed(true)
      }
    } catch {}
  }, [])

  // Redirect unauthenticated visitors to /login immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated])

  // Switch default page if ADM (has scope 'none') and no specific initialPage was given
  useEffect(() => {
    if (isAuthenticated && initialPage === 'queue' && currentUser.role === 'ADM') {
      setCurrentPage('rbac')
    }
  }, [isAuthenticated, currentUser.id, currentUser.role, initialPage])

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
    if (isEvidenceDockOpen) {
      closeEvidenceDock()
    }
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
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setIsCmdkOpen(prev => !prev)
        return
      }

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

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          color: 'var(--s-600, #475569)',
          gap: 12,
        }}
        data-testid="auth-redirect-guard"
      >
        <div style={{ fontWeight: 600, fontSize: 16 }}>กำลังนำทางไปหน้าเข้าสู่ระบบ...</div>
        <a href="/login" style={{ fontSize: 14, color: 'var(--teal-d, #0D9488)' }}>
          คลิกที่นี่หากเบราว์เซอร์ไม่นำทางโดยอัตโนมัติ
        </a>
      </div>
    )
  }


  return (
    <div
      className={`shell ${isNavCollapsed ? 'nav-c' : ''} ${isEvidenceDockOpen ? 'nav-auto' : ''}`}
      id="shell"
    >
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}
      <Topbar
        isNavCollapsed={isNavCollapsed}
        onToggleNav={toggleNav}
        onOpenCmdk={() => setIsCmdkOpen(true)}
      />
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
      <CommandPalette
        isOpen={isCmdkOpen}
        onClose={() => setIsCmdkOpen(false)}
        onNavigate={handleNavigate}
      />
      <Modal />
      <Toast />
      <DocumentAlertHost onNavigateQueue={() => handleNavigate('queue')} />
    </div>
  )
}
