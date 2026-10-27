/**
 * v5.10 — SA "view as": browser side (state, header, read-only UI, sidebar).
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, type RenderResult } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { Sidebar } from '../components/layout/Sidebar'
import { ViewAsBanner } from '../components/viewas/ViewAs'
import { USERS } from '../mock/users'
import { INITIAL_DOCS } from '../mock/initialDocs'
import {
  VIEW_AS_BYPASS,
  VIEW_AS_STORAGE,
  __resetViewAsForTests,
  headerFor,
  installViewAsInterceptor,
  readViewAs,
  writeViewAs,
  type ViewAsState,
} from '../lib/viewAs'
import type { User } from '../types/auth'

const SA = USERS.find(u => u.role === 'SA') as User
const ACC = USERS.find(u => u.role === 'ACC') as User

function state(over: Partial<ViewAsState> = {}): ViewAsState {
  const now = Date.now()
  return {
    target: { kind: 'role', role: 'EU', companies: ['AHT'], receivers: ['R1'] },
    user: { id: 'view-as:EU', name: 'มุมมอง EU', email: '', role: 'EU', companies: ['AHT'], receivers: ['R1'] },
    label: 'role EU',
    startedAt: now,
    expiresAt: now + 60_000,
    serverChecked: true,
    ...over,
  }
}

async function mount(ui: React.ReactElement, user: User): Promise<RenderResult> {
  let r: RenderResult | undefined
  await act(async () => {
    r = render(
      <AuthProvider initialUser={user}>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>{ui}</InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>,
    )
    await new Promise(res => setTimeout(res, 0))
  })
  return r as RenderResult
}

beforeEach(() => {
  __resetViewAsForTests()
  sessionStorage.clear()
})
afterEach(() => vi.unstubAllGlobals())

describe('viewAs storage + header', () => {
  it('expired or SA-target entries are dropped on read', () => {
    writeViewAs(state({ expiresAt: Date.now() - 1 }))
    expect(readViewAs()).toBeNull()
    expect(sessionStorage.getItem(VIEW_AS_STORAGE)).toBeNull()
    writeViewAs(state({ user: { ...state().user, role: 'SA' as any } }))
    expect(readViewAs()).toBeNull()
  })

  it('adds X-View-As to /api/* only — not /api/auth/*, not other origins, not when bypassed', async () => {
    const seen: Array<[string, string | null]> = []
    vi.stubGlobal('fetch', vi.fn(async (input: any, init?: RequestInit) => {
      seen.push([String(input), new Headers(init?.headers).get('X-View-As')])
      return new Response('{}')
    }))
    installViewAsInterceptor()
    writeViewAs(state())
    await fetch('/api/documents')
    await fetch('/api/auth/me')
    await fetch('https://login.microsoftonline.com/x')
    await fetch('/api/users', { headers: { [VIEW_AS_BYPASS]: '1' } })
    expect(seen).toEqual([
      ['/api/documents', headerFor(state().target)],
      ['/api/auth/me', null],
      ['https://login.microsoftonline.com/x', null],
      ['/api/users', null],
    ])
  })
})

describe('AuthContext under view as', () => {
  function Probe() {
    const { currentUser, realUser, isPreview } = useAuth()
    const { allowedAction } = useInvoices()
    const doc = { ...INITIAL_DOCS[0], company: 'AHT', receiver: 'R1', status: 'Review' as const }
    const a = allowedAction(doc, 'confirm')
    return (
      <span data-testid="p">
        {JSON.stringify({ cur: currentUser.role, real: realUser.role, isPreview, ok: a.ok, why: a.why ?? '' })}
      </span>
    )
  }
  const read = () => JSON.parse(screen.getByTestId('p').textContent || '{}')

  it('SA in view-as acts as the target, but every action is blocked', async () => {
    writeViewAs(state({ target: { kind: 'role', role: 'ACC', companies: ['AHT'], receivers: [] }, user: { ...state().user, role: 'ACC' } }))
    await mount(<Probe />, SA)
    const r = read()
    expect(r).toMatchObject({ cur: 'ACC', real: 'SA', isPreview: true, ok: false })
    expect(r.why).toContain('โหมดดูในมุมมอง')
  })

  it('a stored view is ignored (and cleared) for a non-SA user', async () => {
    writeViewAs(state())
    await mount(<Probe />, ACC)
    expect(read()).toMatchObject({ cur: 'ACC', real: 'ACC', isPreview: false })
    expect(readViewAs()).toBeNull()
  })

  it('banner shows who and can leave the view', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}')))
    writeViewAs(state())
    await mount(<><ViewAsBanner /><Probe /></>, SA)
    expect(screen.getByRole('status').textContent).toContain('กำลังดูในมุมมองของ')
    act(() => screen.getByRole('button', { name: /ออกจากมุมมอง/ }).click())
    expect(read()).toMatchObject({ cur: 'SA', isPreview: false })
    expect(readViewAs()).toBeNull()
  })
})

describe('v5.10 sidebar', () => {
  it('groups by work flow; EU sees "ผลการส่งเอกสาร"', async () => {
    const { container } = await mount(<Sidebar currentPage="queue" onNavigate={() => {}} onToggleNav={() => {}} />, ACC)
    const secs = Array.from(container.querySelectorAll('.nav-sec')).map(e => e.textContent)
    expect(secs).toEqual(['ต้องดำเนินการ', 'ส่งจ่าย (AP)', 'ติดตามและประวัติ', 'การกำกับดูแล'])
    expect(screen.getByText('เอกสารที่ปิดแล้ว')).toBeDefined()
  })

  it('EU: no AP section, closed menu is named for the Receiver', async () => {
    const eu = USERS.find(u => u.role === 'EU') as User
    const { container } = await mount(<Sidebar currentPage="queue" onNavigate={() => {}} onToggleNav={() => {}} />, eu)
    const secs = Array.from(container.querySelectorAll('.nav-sec')).map(e => e.textContent)
    expect(secs).toEqual(['ต้องดำเนินการ', 'ติดตามและประวัติ', 'การกำกับดูแล'])
    expect(screen.getByText('ผลการส่งเอกสาร')).toBeDefined()
  })
})
