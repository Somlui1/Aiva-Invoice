import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { App } from '../App'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { SimProvider } from '../context/SimContext'
import { ApPage } from '../components/governance/ApPage'
import { RbacPage } from '../components/governance/RbacPage'
import { CasesPage } from '../components/governance/CasesPage'
import { AuditPage } from '../components/governance/AuditPage'
import { SettingsPage } from '../components/governance/SettingsPage'
import { StdPage } from '../components/governance/StdPage'
import { SimPage } from '../components/governance/SimPage'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'
import { initialDocs } from '../mock/initialDocs'
import { USERS } from '../mock/users'

const smokeUser = USERS[0]

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider initialUser={smokeUser}>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>{children}</SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

describe('App smoke test', () => {
  it('renders the complete portal shell without crashing for authenticated user', () => {
    const html = renderToString(<App initialUser={USERS[0]} />)
    expect(html).toContain('AIVA')
    expect(html).toContain('shell')
    expect(html).toContain('topbar')
    expect(html).toContain('nav')
    expect(html).toContain('queue')
  })

  it('strictly redirects unauthenticated visitors to /login and forbids default IT support login', () => {
    const html = renderToString(<App initialUser={null} />)
    expect(html).toContain('กำลังนำทางไปหน้าเข้าสู่ระบบ...')
    expect(html).toContain('auth-redirect-guard')
    expect(html).not.toContain('itsupport@aapico.com')
    expect(html).not.toContain('กิตติศักดิ์ ซัพพอร์ต')
    expect(html).not.toContain('tbar')
  })

  it('renders ApPage without crashing', () => {
    const html = renderToString(<Wrapper><ApPage /></Wrapper>)
    expect(html).toBeDefined()
  })

  it('renders RbacPage without crashing', () => {
    const html = renderToString(<Wrapper><RbacPage /></Wrapper>)
    expect(html).toContain('สิทธิ์และการเชื่อมบัญชี')
  })

  it('renders CasesPage without crashing', () => {
    const html = renderToString(<Wrapper><CasesPage /></Wrapper>)
    expect(html).toBeDefined()
  })

  it('renders AuditPage without crashing', () => {
    const html = renderToString(<Wrapper><AuditPage /></Wrapper>)
    expect(html).toBeDefined()
  })

  it('renders SettingsPage without crashing', () => {
    const html = renderToString(<Wrapper><SettingsPage /></Wrapper>)
    expect(html).toContain('ตั้งค่าระบบ')
  })

  it('renders StdPage without crashing', () => {
    const html = renderToString(<Wrapper><StdPage /></Wrapper>)
    expect(html).toBeDefined()
  })

  it('renders SimPage without crashing', () => {
    const html = renderToString(<Wrapper><SimPage /></Wrapper>)
    expect(html).toBeDefined()
  })

  it('renders InvoiceDetailPane without crashing', () => {
    const doc = initialDocs[0]
    const html = renderToString(
      <Wrapper>
        <InvoiceDetailPane doc={doc} onOpenActionModal={() => {}} />
      </Wrapper>
    )
    expect(html).toContain(doc.inv)
  })

  it('renders EvidenceViewerDock without crashing', () => {
    const doc = initialDocs[0]
    const html = renderToString(
      <Wrapper>
        <EvidenceViewerDock doc={doc} />
      </Wrapper>
    )
    expect(html).toContain('id="dock"')
  })
})

