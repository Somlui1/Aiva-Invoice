/**
 * v5.3 — AIVA Dark/Light shell (ดีไซน์เดียวกับ aiva-react)
 * ตรวจเฉพาะส่วนที่เพิ่ม: ธีม · Command Palette (Ctrl K) · Topbar breadcrumb/ปุ่มค้นหา
 * โดยไม่เปลี่ยนพฤติกรรมเดิมของ shell
 *
 * @vitest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent, type RenderResult } from '@testing-library/react'
import { InvoiceProvider } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { PortalShell } from '../App'
import { USERS } from '../mock/users'
import { applyTheme, getTheme, THEME_KEY } from '../lib/theme'
import { openCommandPalette } from '../components/shell/CommandPalette'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => {
    throw new Error('PDF.js is not available in jsdom unit tests')
  },
}))

async function mountShell(userOrIndex: number | any = 0): Promise<RenderResult> {
  const user = typeof userOrIndex === 'number' ? USERS[userOrIndex] : userOrIndex
  let result: RenderResult | undefined
  await act(async () => {
    result = render(
      <AuthProvider initialUser={user}>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <SimProvider>
                <PortalShell initialPage="queue" />
              </SimProvider>
            </InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>,
    )
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result as RenderResult
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('{"ok":false,"error":"offline test"}', { status: 500 }))),
  )
  // jsdom ไม่มี matchMedia → ถือว่า reduced motion (ไม่มีแอนิเมชัน)
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('v5.3 theme', () => {
  it('applies data-theme on <html> and remembers it in localStorage "aiva.theme"', () => {
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('light')
    expect(getTheme()).toBe('light')
    applyTheme('dark')
    expect(getTheme()).toBe('dark')
  })
})

describe('v5.3 shell · Topbar + Command Palette', () => {
  it('shows breadcrumb with the current page and a search button', async () => {
    const { container } = await mountShell()
    expect(container.querySelector('.crumb #crumbT')?.textContent).toBeTruthy()
    expect(screen.getByRole('button', { name: 'ค้นหา / คำสั่ง' })).toBeTruthy()
    expect(screen.getByRole('switch', { name: /สลับโหมดสว่าง/ })).toBeTruthy()
  })

  it('opens with Ctrl+K, lists pages/system commands, and closes with Escape', async () => {
    await mountShell()
    expect(screen.queryByRole('dialog', { name: 'ค้นหา / คำสั่ง' })).toBeNull()
    act(() => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    })
    const dlg = screen.getByRole('dialog', { name: 'ค้นหา / คำสั่ง' })
    expect(dlg).toBeTruthy()
    expect(screen.getByText('ออกจากระบบ')).toBeTruthy()
    act(() => {
      fireEvent.keyDown(dlg, { key: 'Escape' })
    })
    expect(screen.queryByRole('dialog', { name: 'ค้นหา / คำสั่ง' })).toBeNull()
  })

  it('filters by query and shows an empty state when nothing matches', async () => {
    await mountShell()
    act(() => openCommandPalette())
    const input = screen.getByRole('textbox', { name: 'ค้นหา' })
    act(() => {
      fireEvent.change(input, { target: { value: 'zzz-no-such-thing' } })
    })
    expect(screen.getByText(/ไม่พบรายการที่ตรงกับ/)).toBeTruthy()
  })

  it('hides the document group for IT admin (ADM)', async () => {
    const admUser = { id: 'u-adm', n: 'IT Admin', email: 'adm@aapico.com', role: 'ADM' as const, rcvName: '—', emp: null, co: [], unit: 'IT' }
    await mountShell(admUser)
    act(() => openCommandPalette())
    expect(screen.queryByText('เอกสารล่าสุดในคิว')).toBeNull()
  })
})
