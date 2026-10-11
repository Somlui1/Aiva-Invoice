/**
 * PDF Evidence Dock — Focus Mode Layout & Auto-Collapse Tests.
 * Design: docs/plans/2026-10-09-pdf-dock-focus-sidebar-cleanup-design.md
 * Plan:   docs/plans/2026-10-09-pdf-dock-focus-sidebar-cleanup.md
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
import { PortalShell } from '../App'
import { QueuePage } from '../components/queue/QueuePage'
import { INITIAL_DOCS } from '../mock/initialDocs'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => {
    throw new Error('PDF.js is not available in jsdom unit tests')
  },
}))

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
    vi.fn(() => Promise.resolve(new Response('{"ok":false,"error":"offline test"}', { status: 500 }))),
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PDF Dock Focus Layout & Auto-Collapse', () => {
  it('applies nav-auto to #shell when PDF dock is open in PortalShell', async () => {
    function ShellHarness() {
      const { setViewMode, selectDoc, openEvidenceDock } = useInvoices()
      return (
        <div>
          <button
            onClick={() => {
              setViewMode('split')
              selectDoc(INITIAL_DOCS[0].doc)
              openEvidenceDock(1)
            }}
          >
            OpenDock
          </button>
          <PortalShell initialPage="queue" />
        </div>
      )
    }

    const { container } = await mount(<ShellHarness />)
    const shell = container.querySelector('#shell') as HTMLElement
    expect(shell).not.toBeNull()
    expect(shell.classList.contains('nav-auto')).toBe(false)

    act(() => {
      screen.getByText('OpenDock').click()
    })

    expect(shell.classList.contains('nav-auto')).toBe(true)
  })

  it('sets --qc to 0px and hides .q47 when dock is open in QueuePage', async () => {
    function PageHarness() {
      const { setViewMode, selectDoc, openEvidenceDock } = useInvoices()
      return (
        <div>
          <button
            onClick={() => {
              setViewMode('split')
              selectDoc(INITIAL_DOCS[0].doc)
              openEvidenceDock(1)
            }}
          >
            OpenDock
          </button>
          <QueuePage />
        </div>
      )
    }

    const { container } = await mount(<PageHarness />)
    act(() => {
      screen.getByText('OpenDock').click()
    })

    const work = container.querySelector('#work') as HTMLElement
    expect(work).not.toBeNull()
    expect(work.classList.contains('pdf-open')).toBe(true)
    expect(work.style.getPropertyValue('--qc')).toBe('0px')
  })

  it('closes PDF dock when hamburger button is clicked while dock is open', async () => {
    function HamburgerHarness() {
      const { setViewMode, selectDoc, openEvidenceDock, isEvidenceDockOpen } = useInvoices()
      return (
        <div>
          <span data-testid="dock-state">{String(isEvidenceDockOpen)}</span>
          <button
            onClick={() => {
              setViewMode('split')
              selectDoc(INITIAL_DOCS[0].doc)
              openEvidenceDock(1)
            }}
          >
            OpenDock
          </button>
          <PortalShell initialPage="queue" />
        </div>
      )
    }

    await mount(<HamburgerHarness />)
    expect(screen.getByTestId('dock-state').textContent).toBe('false')

    act(() => {
      screen.getByText('OpenDock').click()
    })
    expect(screen.getByTestId('dock-state').textContent).toBe('true')

    // Find and click the Topbar hamburger toggle button (aria-label="ย่อ / ขยายเมนู")
    const toggleBtn = screen.getByRole('button', { name: /ย่อ \/ ขยายเมนู/i })
    act(() => {
      toggleBtn.click()
    })

    // Clicking toggle button must force-close the PDF dock
    expect(screen.getByTestId('dock-state').textContent).toBe('false')
  })
})
