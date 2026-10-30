'use client'

import { useState, useEffect, useRef, Fragment, type ReactNode } from 'react'
import type { User } from './types/auth'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastModalProvider } from './context/ToastModalContext'
import { InvoiceProvider, useInvoices } from './context/InvoiceContext'
import { SimProvider } from './context/SimContext'
import { LiveProvider } from './context/LiveContext'
import { Topbar } from './components/layout/Topbar'
import { Sidebar, PageKey, useNavSections } from './components/layout/Sidebar'
import { SplashScreen } from './components/shell/SplashScreen'
import { CommandPalette } from './components/shell/CommandPalette'
import { useOpenDocument } from './components/shell/useOpenDocument'
import { OPEN_DOC_EVENT, type OpenDocRequest } from './lib/openDocument'
import { Modal } from './components/layout/Modal'
import { Toast } from './components/layout/Toast'
import { QueuePage } from './components/queue/QueuePage'
import { ClosedDocsPage } from './components/closed/ClosedDocsPage'
import { ViewAsBanner, ViewAsPicker } from './components/viewas/ViewAs'
import { ApPage } from './components/governance/ApPage'
import { RbacPage } from './components/governance/RbacPage'
import { AuditPage } from './components/governance/AuditPage'
import { GeneralSettingsPage } from './components/settings/GeneralSettingsPage'
import { useCompanyMaster } from './lib/companyMasterClient'
import { LoginPage } from './features/login/LoginPage'
import { StandaloneViewerRoute } from './components/viewer/StandaloneViewerRoute'

/**
 * v5.10: starting / switching / leaving "view as" remounts everything below — documents are reloaded
 * through the server with the new scope, and no selection, filter or open PDF can leak across views.
 */
function ViewAsBoundary({ children }: { children: ReactNode }) {
  const { viewAsKey } = useAuth()
  return <Fragment key={viewAsKey || 'self'}>{children}</Fragment>
}

export function PortalShell({ initialPage = 'queue' }: { initialPage?: PageKey }) {
  const { currentUser, isAuthenticated, isPreview } = useAuth()
  const { isEvidenceDockOpen, closeEvidenceDock, viewMode, selectedDoc } = useInvoices()
  const navSections = useNavSections()
  // v5.13: synced company master (names / ORG_ID) — re-renders the shell once it is applied
  useCompanyMaster(isAuthenticated)
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

  // v5.7: PDF open in split view = focus mode — the app menu hides completely (and the queue column
  // becomes a drawer, see QueuePage) so Validate + PDF use the whole width.
  const pdfFocus =
    (currentPage === 'queue' && viewMode === 'split' && isEvidenceDockOpen && !!selectedDoc) ||
    // v5.9: the closed page owns its own selection and closes the dock itself when it is not shown
    (currentPage === 'closed' && isEvidenceDockOpen)

  const handleNavigate = (page: PageKey) => {
    // v5.9: every page change closes the PDF (each page has its own selection)
    if (page !== currentPage && isEvidenceDockOpen) closeEvidenceDock()
    setCurrentPage(page)
    try {
      if (typeof window !== 'undefined') {
        const targetUrl = page === 'queue' ? '/' : `/${page}`
        window.history.pushState(null, '', targetUrl)
      }
    } catch {}
  }

  // v5.14: "open this document" from any page (AP invoice link, closed-page references) — the shell
  // decides the page (closed vs queue), selects it and opens the PDF preview. See lib/openDocument.ts.
  const openDocument = useOpenDocument(handleNavigate)
  const openDocRef = useRef(openDocument)
  openDocRef.current = openDocument
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<OpenDocRequest>).detail
      if (d?.id) openDocRef.current(d.id, { pdf: d.pdf !== false })
    }
    window.addEventListener(OPEN_DOC_EVENT, on)
    return () => window.removeEventListener(OPEN_DOC_EVENT, on)
  }, [])

  const toggleNav = () => {
    // In PDF focus mode the menu is hidden, not collapsed: "show menu" = leave focus mode only,
    // without flipping the user's saved collapsed/expanded preference.
    if (pdfFocus) {
      closeEvidenceDock()
      return
    }
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
    if (!isAuthenticated) return
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
  }, [isAuthenticated, isEvidenceDockOpen, closeEvidenceDock, pdfFocus])

  // v5.10: a page the current (or previewed) role has no menu for is never rendered — e.g. EU on
  // /ap after a role switch, or /failed once the last failed document is fixed.
  const allowedPages = navSections.flatMap(sec => sec.items).filter(it => it.isAllowed).map(it => it.key)
  const pageAllowed = allowedPages.includes(currentPage)
  useEffect(() => {
    if (isAuthenticated && !pageAllowed && allowedPages.length) {
      setCurrentPage(allowedPages.includes('queue') ? 'queue' : allowedPages[0])
    }
  }, [isAuthenticated, pageAllowed, allowedPages.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  // ชื่อหน้าสำหรับ breadcrumb ของ Topbar (AIVA › หน้า)
  const pageTitle =
    navSections.flatMap(sec => sec.items).find(it => it.key === currentPage)?.label || ''

  if (!isAuthenticated) {
    return (
      <div className="auth-guard" data-testid="auth-redirect-guard">
        <div style={{ fontWeight: 600, fontSize: 16 }}>กำลังนำทางไปหน้าเข้าสู่ระบบ...</div>
        <a href="/login">คลิกที่นี่หากเบราว์เซอร์ไม่นำทางโดยอัตโนมัติ</a>
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'queue':
        return <QueuePage />
      case 'closed':
        return <ClosedDocsPage />
      case 'ap':
        return <ApPage key="ap" />
      case 'failed':
        // v5.10: "นำเข้า Oracle ไม่สำเร็จ" = the AP page opened on its failed tab
        return <ApPage key="failed" initialTab="failed" />
      case 'rbac':
        return <RbacPage />
      case 'audit':
        return <AuditPage />
      case 'settings':
        return <GeneralSettingsPage />
      default:
        return <QueuePage />
    }
  }

  return (
    <div
      className={`shell ${isNavCollapsed ? 'nav-c' : ''} ${pdfFocus ? 'nav-auto' : ''}`}
      id="shell"
    >
      <Topbar isNavCollapsed={isNavCollapsed} onToggleNav={toggleNav} pageTitle={pageTitle} navHidden={pdfFocus} />
      <div className="body">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onToggleNav={toggleNav}
        />
        <main className={`main${isPreview ? ' is-preview' : ''}`} id="app">
          <ViewAsBanner />
          {pageAllowed || !allowedPages.length ? renderCurrentPage() : null}
        </main>
      </div>
      <Modal />
      <Toast />
      <CommandPalette onNavigate={handleNavigate} onToggleNav={toggleNav} />
      <ViewAsPicker />
    </div>
  )
}

function resolvePageFromPath(path: string): PageKey | undefined {
  const clean = path.replace(/^\//, '').split('/')[0]
  // v5.7: /cases, /std, /sim were removed — old bookmarks fall back to the queue.
  // v5.13: /settings is back as ตั้งค่า › ตั้งค่าทั่วไป (personal preferences)
  const validPages: PageKey[] = ['queue', 'closed', 'ap', 'failed', 'rbac', 'audit', 'settings']
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
    return (
      <>
        <LoginPage />
        <SplashScreen />
      </>
    )
  }

  const effectivePage = resolvePageFromPath(currentPath) || initialPage

  return (
    <AuthProvider initialUser={initialUser}>
      <SettingsProvider>
        <ToastModalProvider>
          <ViewAsBoundary>
            <InvoiceProvider>
              <LiveProvider>
                <SimProvider>
                  <PortalShell initialPage={effectivePage} />
                  <SplashScreen />
                </SimProvider>
              </LiveProvider>
            </InvoiceProvider>
          </ViewAsBoundary>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App
