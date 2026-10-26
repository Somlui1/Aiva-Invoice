/**
 * F5 / F6 — the dock's keyboard shortcuts and its auto-scroll.
 *
 * Mounts the **real** `EvidenceViewerDock`: the projector (`projectOverlayBoxes`), the `.hl` overlay,
 * `InvoiceContext.openEvidence` / `evidenceDockFocus`, the `window` keydown handler and the
 * "scroll once, then stay put" effect are the code under test.
 *
 * Only what jsdom cannot do is mocked:
 *   • `pdfjs-dist` — no rasteriser here (the dock falls back like it does offline),
 *   • `usePdfViewer` — replaced by a hook that reports a ready PDF page, so the *PDF* overlay path
 *     (the one with real per-finding boxes) renders instead of the measured mock page,
 *   • `ResizeObserver` and `HTMLElement.prototype.scrollIntoView` — recorded, not executed.
 *
 * Fixture: `temp/paperless_invoices_v5/DMS-27_result.json` through the real adapter —
 * X1 unlocated (V-01) · X2..X11 V-07 · X12..X15 V-08, and X4/X5/X12..X15 carry 2 boxes.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render, screen, waitFor, type RenderResult } from '@testing-library/react'

import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'
import { AuthProvider } from '../context/AuthContext'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { SettingsProvider } from '../context/SettingsContext'
import { SimProvider } from '../context/SimContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import { portalDocToInvoiceDoc } from '../features/engine/adapters/portalDocToInvoiceDoc'
import { documentFindings } from '../features/evidence/findings'
import type { EvidenceDockFocus } from '../features/evidence/focus'
import type { InvoiceDoc } from '../types/invoice'

const PAGES = 11

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => {
    throw new Error('PDF.js is not available in jsdom unit tests')
  },
}))

/** The transport jsdom cannot run. The page it reports is what the overlay projects against. */
vi.mock('../features/pdf-viewer/hooks/usePdfViewer', () => ({
  usePdfViewer: () => ({
    status: { state: 'ready', mode: 'pdf', pageCount: 11, source: 'paperless' },
    canvasRef: { current: null },
    pageSize: { width: 600, height: 800 },
    reload: () => {},
  }),
}))

const DIR = path.resolve(process.cwd(), 'temp/paperless_invoices_v5')
const loadDoc = (id: string): InvoiceDoc =>
  portalDocToInvoiceDoc(
    transformEngineResultToPortalDoc(JSON.parse(fs.readFileSync(path.join(DIR, `${id}_result.json`), 'utf-8'))),
    { includeBoxes: true },
  )

const DOC = loadDoc('DMS-27')
const FINDINGS = documentFindings(DOC)

function Harness({ doc }: { doc: InvoiceDoc }) {
  const { evidenceDockFocus, openEvidence } = useInvoices()
  const list = documentFindings(doc)
  return (
    <div id="work">
      {list.map(f => (
        <button key={f.id} type="button" data-testid={`open-${f.id}`} onClick={() => openEvidence(f, 0)}>
          open {f.id}
        </button>
      ))}
      <input data-testid="text" type="text" />
      <pre data-testid="focus">{JSON.stringify(evidenceDockFocus)}</pre>
      <EvidenceViewerDock doc={doc} />
    </div>
  )
}

/** Every scrollIntoView call, with the element that received it. */
let scrollCalls: { el: Element }[] = []
const scrollLog = (): string[] => scrollCalls.map(c => c.el.getAttribute('data-id') || c.el.className)
const originalScroll = HTMLElement.prototype.scrollIntoView

async function mountDock(doc: InvoiceDoc): Promise<RenderResult> {
  let result: RenderResult | undefined
  await act(async () => {
    result = render(
      <AuthProvider>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>
              <SimProvider>
                <Harness doc={doc} />
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

const focus = (): EvidenceDockFocus | null =>
  JSON.parse(screen.getByTestId('focus').textContent || 'null') as EvidenceDockFocus | null

const openFinding = async (id: string): Promise<void> => {
  await act(async () => {
    screen.getByTestId(`open-${id}`).click()
    await new Promise(resolve => setTimeout(resolve, 220)) // the dock scrolls on a 150ms timer
  })
}

const press = async (key: string, mods: Record<string, boolean> = {}): Promise<void> => {
  await act(async () => {
    fireEvent.keyDown(window, { key, ...mods })
    await new Promise(resolve => setTimeout(resolve, 220))
  })
}

const chips = (): string[] =>
  Array.from(document.querySelectorAll('.evchip[data-finding]')).map(c => c.getAttribute('data-finding') as string)

const pageLabel = (): string => {
  const span = Array.from(document.querySelectorAll('.pager span')).find(s => /หน้า/.test(s.textContent || ''))
  return (span?.textContent || '').replace(/\s+/g, ' ').trim()
}

beforeEach(() => {
  scrollCalls = []
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
  HTMLElement.prototype.scrollIntoView = function (this: HTMLElement, ...args: Parameters<Element['scrollIntoView']>) {
    scrollCalls.push({ el: this })
    void args
  }
})

afterEach(() => {
  HTMLElement.prototype.scrollIntoView = originalScroll
  vi.unstubAllGlobals()
})

describe('fixture sanity', () => {
  it('DMS-27 carries the findings and box counts the shortcuts are tested against', async () => {
    await mountDock(DOC)
    const byId = new Map(FINDINGS.map(f => [f.id, f] as const))
    expect(FINDINGS.length).toBe(15)
    expect(byId.get('X1')?.targets.length).toBe(0) // unlocated: V-01 with no box
    expect(byId.get('X4')?.targets.length).toBeGreaterThanOrEqual(2)
    expect(byId.get('X12')?.targets.length).toBeGreaterThanOrEqual(2)
    expect(chips()).toEqual(FINDINGS.map(f => f.id)) // the chip strip walks the same list
    expect(pageLabel()).toBe(`หน้า 1 / ${PAGES}`)
  })
})

describe('(a) Alt+→ / Alt+← step the box of the focused finding and wrap', () => {
  it('moves targetIdx 0 → 1 and back, and wraps at both ends without changing the finding', async () => {
    await mountDock(DOC)
    await openFinding('X4')
    expect(focus()).toMatchObject({ findingId: 'X4', targetIdx: 0, locatable: true })

    await press('ArrowRight', { altKey: true })
    expect(focus()).toMatchObject({ findingId: 'X4', targetIdx: 1 })

    const last = focus()!.targetIdx
    await press('ArrowRight', { altKey: true }) // wraps to the first box
    expect(focus()).toMatchObject({ findingId: 'X4', targetIdx: 0 })

    await press('ArrowLeft', { altKey: true }) // wraps back to the last box
    expect(focus()).toMatchObject({ findingId: 'X4', targetIdx: last })

    await press('ArrowLeft', { altKey: true })
    expect(focus()).toMatchObject({ findingId: 'X4', targetIdx: 0 })
  })

  it('plain arrows (no Alt) are left alone', async () => {
    await mountDock(DOC)
    await openFinding('X4')
    const before = focus()
    await press('ArrowRight')
    expect(focus()).toEqual(before)
  })
})

describe('(b) Alt+↓ / Alt+↑ walk the findings in chip order', () => {
  it('follows the strip one step at a time and wraps past the ends', async () => {
    await mountDock(DOC)
    const order = chips()
    expect(order.length).toBeGreaterThan(3)

    await openFinding(order[0])
    expect(focus()?.findingId).toBe(order[0])

    await press('ArrowDown', { altKey: true })
    expect(focus()?.findingId).toBe(order[1])
    await press('ArrowDown', { altKey: true })
    expect(focus()?.findingId).toBe(order[2])
    await press('ArrowUp', { altKey: true })
    expect(focus()?.findingId).toBe(order[1])

    await press('ArrowUp', { altKey: true })
    await press('ArrowUp', { altKey: true }) // wraps to the last chip
    expect(focus()?.findingId).toBe(order[order.length - 1])
  })

  it('the active chip is the one in focus', async () => {
    await mountDock(DOC)
    await openFinding('X12')
    const on = Array.from(document.querySelectorAll('.evchip[aria-pressed="true"]')).map(c => c.getAttribute('data-finding'))
    expect(on).toEqual(['X12'])
  })
})

describe('(c) the shortcut is off while typing and when Ctrl/Meta is held', () => {
  it('ignores Alt+arrow while an <input> has focus', async () => {
    await mountDock(DOC)
    await openFinding('X4')
    const before = focus()
    await act(async () => {
      screen.getByTestId('text').focus()
      fireEvent.keyDown(screen.getByTestId('text'), { key: 'ArrowRight', altKey: true })
      await new Promise(resolve => setTimeout(resolve, 60))
    })
    expect(focus()).toEqual(before)
  })

  it('ignores Alt+arrow sent from a contenteditable', async () => {
    await mountDock(DOC)
    await openFinding('X4')
    const before = focus()
    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    // jsdom never implements `isContentEditable` (it stays false even with the attribute set),
    // so the flag the browser would compute is supplied here — the handler's guard stays real.
    Object.defineProperty(editable, 'isContentEditable', { value: true })
    document.body.appendChild(editable)
    await act(async () => {
      fireEvent.keyDown(editable, { key: 'ArrowDown', altKey: true })
      await new Promise(resolve => setTimeout(resolve, 60))
    })
    editable.remove()
    expect(focus()).toEqual(before)
  })

  it('ignores Ctrl+Alt and Meta+Alt combinations', async () => {
    await mountDock(DOC)
    await openFinding('X4')
    const before = focus()
    await press('ArrowRight', { altKey: true, ctrlKey: true })
    expect(focus()).toEqual(before)
    await press('ArrowDown', { altKey: true, metaKey: true })
    expect(focus()).toEqual(before)
  })
})

describe('(d) opening a finding scrolls once — zooming must not scroll again', () => {
  it('zooming after opening adds no scroll of its own', async () => {
    const { container } = await mountDock(DOC)
    await openFinding('X12') // V-08 on page 1: the page the dock already shows
    expect(container.querySelector('.hl.focus')).not.toBeNull()

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400)) // let the 150ms + 60ms timers settle
    })
    const afterOpen = scrollCalls.length

    const zoomIn = container.querySelector('[title="ขยาย"]') as HTMLButtonElement
    expect(zoomIn).not.toBeNull()
    await act(async () => {
      zoomIn.click()
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    const zoomLabel = () =>
      Array.from(container.querySelectorAll('.pager span'))
        .map(s => (s.textContent || '').trim())
        .find(t => /%$/.test(t))
    expect(zoomLabel()).toBe('110%') // the click really changed the zoom
    expect(scrollCalls.length).toBe(afterOpen) // … and it did not scroll

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(scrollCalls.length).toBe(afterOpen)
  })

  it('scrolls exactly one time for the one finding that was opened', async () => {
    const { container } = await mountDock(DOC)
    await openFinding('X12')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(container.querySelector('.hl.focus')).not.toBeNull()
    // one open = one scroll, on one element
    expect(new Set(scrollLog()).size).toBe(1) // the same box each time…
    expect(scrollLog().join(' + ')).toBe(scrollLog()[0]) // …scrolled once
  })
})

describe('(e) an unlocated finding never moves the PDF', () => {
  it('asks for no scroll and leaves the page it is on', async () => {
    const { container } = await mountDock(DOC)
    await openFinding('X1') // V-01: no box, reason only

    expect(focus()).toMatchObject({ findingId: 'X1', locatable: false })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(scrollCalls.length).toBe(0)
    expect(container.querySelector('.hl.focus')).toBeNull()
    expect(pageLabel()).toBe(`หน้า 1 / ${PAGES}`)
  })

  it('stepping the findings of an unlocated one still does not move the PDF', async () => {
    const { container } = await mountDock(DOC)
    await openFinding('X1')
    await press('ArrowDown', { altKey: true }) // X2 is located but its own request is the only scroll
    expect(focus()?.findingId).toBe('X2')
    const scrolls = scrollCalls.length
    await press('ArrowUp', { altKey: true })
    expect(focus()?.findingId).toBe('X1')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(scrollCalls.length).toBe(scrolls) // going back onto X1 adds nothing
    expect(container.querySelector('.hl.focus')).toBeNull()
  })

  it('DMS-40 (every finding unlocated) never scrolls', async () => {
    await mountDock(loadDoc('DMS-40'))
    await openFinding('X1')
    expect(focus()?.locatable).toBe(false)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    expect(scrollCalls.length).toBe(0)
  })
})
