/**
 * Tests for the PDF Dock Mockup-Faithful 3-Tier Header & Controls.
 *
 * Verifies:
 * 1. Tier 1: .dock-h with title, subtitle, action buttons (checkc, ext, dl), and .btn-close-pdf.
 * 2. Tier 2: .dock-tb with .seg (เอกสาร/หลักฐาน), .pager (zoom controls + fit-to-width), and .pager (pagination).
 * 3. Tier 3: .evbar with .evchip buttons for exception rules.
 * 4. Tier 4: .dock-f with lock icon and watermark/token notice.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'
import { DockControls } from '../components/evidence/DockControls'
import type { InvoiceDoc } from '../types/invoice'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => {
    throw new Error('PDF.js is not available in jsdom unit tests')
  },
}))

function TestWrapper({ children }: { children: React.ReactNode }) {
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

const SAMPLE_DOC: InvoiceDoc = {
  doc: 'DMS-2026-000131',
  inv: 'A631577',
  vendor: 'Thai Steel Service Co., Ltd.',
  stax: '0105536012345',
  company: 'AHT',
  dt: '2026-09-26',
  up: '2026-09-26',
  total: 19317.78,
  pages: 2,
  status: 'Hold',
  codes: ['E08'],
  rules: [
    {
      id: 'V-06',
      rule: 'V-06',
      name: 'Signature Missing',
      exception_code: 'E08',
      status: 'FAIL',
      result: 'fail',
      severity: 'High',
      page: 1,
    },
  ],
  history: [],
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('{"ok":false,"error":"test"}', { status: 500 }))),
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

describe('PDF Dock Mockup-Faithful 3-Tier Header & Controls', () => {
  it('renders Tier 1 (.dock-h) with document info, actions, and red close button', () => {
    const onClose = vi.fn()
    const { container } = render(
      <TestWrapper>
        <DockControls
          doc={SAMPLE_DOC}
          currentPage={1}
          totalPages={2}
          zoom={1}
          onPageChange={vi.fn()}
          onZoomChange={vi.fn()}
          onClose={onClose}
        />
      </TestWrapper>,
    )

    const dockH = container.querySelector('.dock-h')
    expect(dockH).not.toBeNull()

    // Title & subtitle
    expect(dockH?.textContent).toContain('A631577 · DMS-2026-000131')
    expect(dockH?.textContent).toContain('Thai Steel Service Co., Ltd. · 2 หน้า')

    // Action buttons
    const testBtn = screen.getByRole('button', { name: 'ทดสอบการแสดงผล' })
    const extBtn = screen.getByRole('button', { name: 'เปิดในแท็บใหม่' })
    const printBtn = screen.getByRole('button', { name: 'พิมพ์ หรือบันทึกเป็น PDF' })
    expect(testBtn).not.toBeNull()
    expect(extBtn).not.toBeNull()
    expect(printBtn).not.toBeNull()

    // Red Close Button
    const closeBtn = container.querySelector('.btn-close-pdf') as HTMLButtonElement
    expect(closeBtn).not.toBeNull()
    expect(closeBtn.textContent).toContain('ปิด PDF')
    expect(closeBtn.textContent).toContain('Esc')

    act(() => {
      closeBtn.click()
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders Tier 2 (.dock-tb) with mode toggle, zoom pager, and pagination', () => {
    const onZoomChange = vi.fn()
    const onPageChange = vi.fn()
    const onToggleEvidence = vi.fn()

    const { container } = render(
      <TestWrapper>
        <DockControls
          doc={SAMPLE_DOC}
          currentPage={1}
          totalPages={2}
          zoom={1}
          onPageChange={onPageChange}
          onZoomChange={onZoomChange}
          onToggleEvidence={onToggleEvidence}
          onClose={vi.fn()}
          showEvidence={true}
        />
      </TestWrapper>,
    )

    const dockTb = container.querySelector('.dock-tb')
    expect(dockTb).not.toBeNull()

    // Segmented toggle
    const seg = dockTb?.querySelector('.seg')
    expect(seg).not.toBeNull()
    const docModeBtn = screen.getByRole('button', { name: /เอกสาร/i })
    const evModeBtn = screen.getByRole('button', { name: /หลักฐาน/i })
    expect(evModeBtn.classList.contains('on')).toBe(true)
    expect(docModeBtn.classList.contains('on')).toBe(false)

    act(() => {
      docModeBtn.click()
    })
    expect(onToggleEvidence).toHaveBeenCalledWith(false)

    // Zoom pager
    const zoomOut = screen.getByRole('button', { name: 'ย่อ' })
    const zoomIn = screen.getByRole('button', { name: 'ขยาย' })
    const fitWidth = screen.getByRole('button', { name: 'พอดีความกว้าง' })
    expect(dockTb?.textContent).toContain('100%')

    act(() => {
      fitWidth.click()
    })
    expect(onZoomChange).toHaveBeenCalledWith(1)

    // Pagination
    const prevPage = screen.getByRole('button', { name: 'หน้าก่อน' }) as HTMLButtonElement
    const nextPage = screen.getByRole('button', { name: 'หน้าถัดไป' }) as HTMLButtonElement
    expect(prevPage.disabled).toBe(true) // on page 1
    expect(nextPage.disabled).toBe(false)
    expect(dockTb?.textContent).toContain('หน้า 1 / 2')

    act(() => {
      nextPage.click()
    })
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('renders Tier 3 (.evbar) with clickable evidence chips', () => {
    const onSelectRule = vi.fn()
    const { container } = render(
      <TestWrapper>
        <DockControls
          doc={SAMPLE_DOC}
          currentPage={1}
          totalPages={2}
          zoom={1}
          onPageChange={vi.fn()}
          onZoomChange={vi.fn()}
          onClose={vi.fn()}
          showEvidence={true}
          activeRuleId="V-06"
          onSelectRule={onSelectRule}
        />
      </TestWrapper>,
    )

    const evbar = container.querySelector('.evbar')
    expect(evbar).not.toBeNull()

    // One chip per finding (evidence row). SAMPLE_DOC's rule carries no box, so its single
    // (rebuilt) finding is "no position": dashed chip, and no page is passed on.
    const chip = evbar?.querySelector('.evchip') as HTMLButtonElement
    expect(chip).not.toBeNull()
    expect(chip.classList.contains('on')).toBe(true)
    expect(chip.classList.contains('noloc')).toBe(true)
    expect(chip.textContent).toContain('E08')
    expect(chip.textContent).toContain('V-06')
    expect(chip.textContent).toContain('ไม่มีตำแหน่ง')

    act(() => {
      chip.click()
    })
    expect(onSelectRule).toHaveBeenCalledWith('V-06', undefined)
  })

  it('a chip of a finding with a box shows its page and reports the finding', () => {
    const onSelectFinding = vi.fn()
    const located: InvoiceDoc = {
      ...SAMPLE_DOC,
      rules: [{ ...SAMPLE_DOC.rules[0], bbox: { x: 0.1, y: 0.8, w: 0.3, h: 0.08, page: 2 } }],
    }
    const { container } = render(
      <TestWrapper>
        <DockControls
          doc={located}
          currentPage={1}
          totalPages={2}
          zoom={1}
          onPageChange={vi.fn()}
          onZoomChange={vi.fn()}
          onClose={vi.fn()}
          showEvidence={true}
          onSelectFinding={onSelectFinding}
        />
      </TestWrapper>,
    )
    const chip = container.querySelector('.evbar .evchip') as HTMLButtonElement
    expect(chip.classList.contains('loc')).toBe(true)
    expect(chip.textContent).toContain('· หน้า 2')
    act(() => {
      chip.click()
    })
    expect(onSelectFinding).toHaveBeenCalledTimes(1)
    expect(onSelectFinding.mock.calls[0][0].ruleId).toBe('V-06')
  })

  it('renders EvidenceViewerDock with 3-tier chrome and .dock-f footer', () => {
    const { container } = render(
      <TestWrapper>
        <EvidenceViewerDock doc={SAMPLE_DOC} />
      </TestWrapper>,
    )

    expect(container.querySelector('#dock')).not.toBeNull()
    expect(container.querySelector('.dock-h')).not.toBeNull()
    expect(container.querySelector('.dock-tb')).not.toBeNull()
    expect(container.querySelector('.evbar')).not.toBeNull()
    expect(container.querySelector('#dockFoot')).not.toBeNull()
    expect(container.querySelector('#dockFoot')?.textContent).toContain('ลิงก์ชั่วคราว 10 นาที')
  })
})
