'use client'

import { useState, useEffect } from 'react'
import type { User } from './types/auth'
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
import { LoginPage } from './features/login/LoginPage'
import { StandaloneViewerRoute } from './components/viewer/StandaloneViewerRoute'

export function PortalShell({ initialPage = 'queue' }: { initialPage?: PageKey }) {
  const { currentUser, isAuthenticated } = useAuth()
  const { isEvidenceDockOpen, closeEvidenceDock } = useInvoices()
  const [currentPage, setCurrentPage] = useState<PageKey>(initialPage)
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && window.localStorage.getItem('aiva.nav') === 'c'
    } catch {
      return false
    }
  })

  // Redirect unauthenticated visitors to /login smoothly in SPA mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
      window.history.pushState(null, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [isAuthenticated])

  // Switch default page if ADM (has scope 'none') and no specific initialPage was given
  useEffect(() => {
    if (isAuthenticated && initialPage === 'queue' && currentUser.role === 'ADM') {
      setCurrentPage('rbac')
    }
  }, [isAuthenticated, currentUser.id, currentUser.role, initialPage])

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
    <div
      className={`shell ${isNavCollapsed ? 'nav-c' : ''} ${isEvidenceDockOpen ? 'nav-auto' : ''}`}
      id="shell"
    >
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

function resolvePageFromPath(path: string): PageKey | undefined {
  const clean = path.replace(/^\//, '').split('/')[0]
  const validPages: PageKey[] = ['queue', 'ap', 'rbac', 'cases', 'audit', 'settings', 'std', 'sim']
  if (validPages.includes(clean as PageKey)) {
    return clean as PageKey
  }
  return undefined
}

export function App({
  initialPage = 'queue',
  initialUser,
  route,
}: {
  initialPage?: PageKey
  initialUser?: User | null
  route?: string
}) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (route) return route
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/'
    }
    return '/'
  })

  useEffect(() => {
    const onPopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname || '/')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  if (currentPath.startsWith('/viewer/')) {
    const docId = currentPath.replace(/^\/viewer\//, '').split('/')[0]
    return <StandaloneViewerRoute docId={docId} />
  }

  if (currentPath === '/login') {
    return <LoginPage />
  }

  const effectivePage = resolvePageFromPath(currentPath) || initialPage

  return (
    <AuthProvider initialUser={initialUser}>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>
              <PortalShell initialPage={effectivePage} />
            </SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
