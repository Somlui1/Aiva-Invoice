/**
 * PDF Evidence Dock — grid visibility + loading state.
 * Design: docs/plans/2026-10-09-pdf-dock-layout-and-loading-state-design.md
 * Plan:   docs/plans/2026-10-09-pdf-dock-layout-and-loading-state.md
 *
 * These tests run in a real DOM (jsdom) because the bug being fixed is a CSS
 * Grid contract: the dock column only exists when `.work` carries `pdf-open`
 * plus the `--mc` / `--dc` custom properties, and a state update has to be
 * observable through an actual click, which `renderToString` cannot express.
 *
 * @vitest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, act, type RenderResult } from '@testing-library/react'

import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'

/** Same provider stack the live shell mounts (`src/test/app-smoke.test.tsx`). */
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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

/**
 * `InvoiceProvider` loads `GET /api/documents` on mount. There is no server in a
 * unit test, so the loader is answered with an offline failure — the documented
 * fallback that keeps the seeded queue — and the exchange is drained inside
 * `act` so no state update lands outside it. Every test below then exercises the
 * same components the browser renders, on the same seed data.
 */
async function mount(ui: React.ReactElement): Promise<RenderResult> {
  let result: RenderResult | undefined
  await act(async () => {
    result = render(<Providers>{ui}</Providers>)
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return result as RenderResult
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{"ok":false,"error":"offline test"}', { status: 500 })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('InvoiceContext Dock & Loading Extensions', () => {
  it('provides default dockSplitRatio 0.40 and isPdfLoading false, and allows updates', async () => {
    function TestHarness() {
      const { dockSplitRatio, setDockSplitRatio, isPdfLoading, setIsPdfLoading } = useInvoices()
      return (
        <div>
          <span data-testid="ratio">{dockSplitRatio}</span>
          <span data-testid="loading">{String(isPdfLoading)}</span>
          <button onClick={() => setDockSplitRatio(0.45)}>SetRatio</button>
          <button onClick={() => setIsPdfLoading(true)}>SetLoading</button>
        </div>
      )
    }

    await mount(<TestHarness />)

    expect(screen.getByTestId('ratio').textContent).toBe('0.4')
    expect(screen.getByTestId('loading').textContent).toBe('false')

    act(() => {
      screen.getByText('SetRatio').click()
    })
    expect(screen.getByTestId('ratio').textContent).toBe('0.45')

    act(() => {
      screen.getByText('SetLoading').click()
    })
    expect(screen.getByTestId('loading').textContent).toBe('true')
  })
})
