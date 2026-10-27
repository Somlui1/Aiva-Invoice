'use client'

/**
 * v5.11 — left side of "ผูกใบรับ": every PDF page in one vertical scroll.
 *
 *  - Pages are laid out at once from their sizes (so the scrollbar is right), but a page is only
 *    PAINTED when it comes near the viewport (IntersectionObserver, 1 screen of margin) and its
 *    canvas is released again when it goes far away — a 40-page document stays light.
 *  - Boxes: only the ones the right panel asks for (`boxes`) are drawn; `activeId` is emphasised.
 *    Clicking a drawn box calls `onBoxClick` (table row highlight, PDF → table direction).
 *  - `scrollTo` (id + nonce) scrolls the box into the middle of the view; no box → nothing moves.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { loadPdfjs } from '../../features/pdf-viewer/hooks/usePdfViewer'
import { normalizedToPixelBox } from '../../features/pdf-viewer/lib/coordinateTransform'
import { Icon } from '../common/Icon'

export interface PaneBox {
  id: string
  pageNo: number
  bbox: [number, number, number, number]
  tone: 'row' | 'field' | 'diff'
  label?: string
}

interface Props {
  documentId: string
  boxes: PaneBox[]
  activeId: string | null
  scrollTo: { id: string; nonce: number } | null
  onBoxClick: (id: string) => void
}

type LoadState = { k: 'loading' } | { k: 'ready'; pages: Array<{ w: number; h: number }> } | { k: 'error'; msg: string }

const GAP = 16

export function LinkPdfPane({ documentId, boxes, activeId, scrollTo, onBoxClick }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const [state, setState] = useState<LoadState>({ k: 'loading' })
  const [width, setWidth] = useState(600)
  const [attempt, setAttempt] = useState(0)
  const [near, setNear] = useState<Set<number>>(() => new Set([1]))

  // width of the scroll area → page width
  useEffect(() => {
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.floor(e.contentRect.width) - 2 * GAP)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // load the document once
  useEffect(() => {
    let disposed = false
    let opened: PDFDocumentProxy | null = null
    setState({ k: 'loading' })
    void (async () => {
      try {
        const { getDocument } = await loadPdfjs()
        const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/pdf`, { cache: 'no-store', credentials: 'same-origin' })
        if (!res.ok) throw new Error(`โหลด PDF ไม่ได้ (HTTP ${res.status})`)
        if (res.headers.get('X-PDF-Source') === 'fallback_mock' || !res.headers.get('Content-Type')?.includes('pdf')) {
          throw new Error(res.headers.get('X-PDF-Fallback-Reason') || 'ไม่มีไฟล์ PDF ของเอกสารนี้')
        }
        const data = new Uint8Array(await res.arrayBuffer())
        opened = await getDocument({ data }).promise
        if (disposed) return void opened.destroy()
        const pages: Array<{ w: number; h: number }> = []
        for (let i = 1; i <= opened.numPages; i++) {
          const pg = await opened.getPage(i)
          const vp = pg.getViewport({ scale: 1 })
          pages.push({ w: vp.width, h: vp.height })
        }
        if (disposed) return void opened.destroy()
        pdfRef.current = opened
        setState({ k: 'ready', pages })
      } catch (err) {
        if (!disposed) setState({ k: 'error', msg: err instanceof Error ? err.message : String(err) })
      }
    })()
    return () => {
      disposed = true
      pdfRef.current = null
      if (opened) void opened.destroy()
    }
  }, [documentId, attempt])

  const scaleOf = useCallback((p: { w: number }) => width / p.w, [width])

  // which pages are near the viewport
  useEffect(() => {
    if (state.k !== 'ready' || typeof IntersectionObserver === 'undefined') return
    const root = scrollRef.current
    if (!root) return
    const io = new IntersectionObserver(
      entries => {
        setNear(prev => {
          const next = new Set(prev)
          for (const e of entries) {
            const n = Number((e.target as HTMLElement).dataset.page)
            if (e.isIntersecting) next.add(n)
            else next.delete(n)
          }
          return next
        })
      },
      { root, rootMargin: '100% 0px' },
    )
    root.querySelectorAll('[data-page]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [state])

  // scroll a box into view
  useEffect(() => {
    if (!scrollTo || state.k !== 'ready') return
    const box = boxes.find(b => b.id === scrollTo.id)
    const root = scrollRef.current
    if (!box || !root) return
    const pageEl = root.querySelector<HTMLElement>(`[data-page="${box.pageNo}"]`)
    const page = state.pages[box.pageNo - 1]
    if (!pageEl || !page) return
    const h = page.h * scaleOf(page)
    const y = pageEl.offsetTop + box.bbox[1] * h - root.clientHeight / 2 + (box.bbox[3] * h) / 2
    root.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
  }, [scrollTo, state, boxes, scaleOf])

  return (
    <div className="rl-pdf">
      {state.k === 'loading' && (
        <div className="rl-pdf-state" role="status">
          <span className="rl-spin" aria-hidden /> กำลังโหลด PDF…
        </div>
      )}
      {state.k === 'error' && (
        <div className="rl-pdf-state err" role="alert">
          <Icon name="alert" />
          <div>
            <b>แสดง PDF ไม่ได้</b>
            <p>{state.msg}</p>
            <button type="button" className="btn btn-sec sm" onClick={() => setAttempt(a => a + 1)}>
              <Icon name="refresh" size="sm" /> ลองใหม่
            </button>
          </div>
        </div>
      )}
      <div className="rl-pdf-scroll" ref={scrollRef}>
        {state.k === 'ready' &&
          state.pages.map((p, i) => {
            const n = i + 1
            const s = scaleOf(p)
            const size = { width: Math.round(p.w * s), height: Math.round(p.h * s) }
            return (
              <div key={n} className="rl-page" data-page={n} style={{ width: size.width, height: size.height }}>
                {near.has(n) ? <PageCanvas pdf={pdfRef.current} pageNo={n} width={size.width} height={size.height} scale={s} /> : <div className="rl-page-ph">หน้า {n}</div>}
                <span className="rl-page-no">หน้า {n} / {state.pages.length}</span>
                {boxes
                  .filter(b => b.pageNo === n)
                  .map(b => {
                    const px = normalizedToPixelBox(b.bbox, size)
                    if (!px) return null
                    return (
                      <button
                        type="button"
                        key={b.id}
                        className={`rl-box ${b.tone}${activeId === b.id ? ' on' : ''}`}
                        style={{ left: px.left, top: px.top, width: px.width, height: px.height }}
                        title={b.label ? `${b.label} · กดเพื่อไปที่แถวในตาราง` : 'กดเพื่อไปที่แถวในตาราง'}
                        aria-label={b.label ?? b.id}
                        onClick={() => onBoxClick(b.id)}
                      />
                    )
                  })}
              </div>
            )
          })}
      </div>
    </div>
  )
}

function PageCanvas({ pdf, pageNo, width, height, scale }: { pdf: PDFDocumentProxy | null; pageNo: number; width: number; height: number; scale: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!pdf || !ref.current) return
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null
    let cancelled = false
    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    void pdf
      .getPage(pageNo)
      .then(page => {
        if (cancelled || !ref.current) return
        const vp = page.getViewport({ scale: scale * dpr })
        const c = ref.current
        c.width = Math.floor(vp.width)
        c.height = Math.floor(vp.height)
        const ctx = c.getContext('2d')
        if (!ctx) return
        task = page.render({ canvasContext: ctx, viewport: vp, canvas: c } as any) as any
        return task!.promise
      })
      .catch(err => {
        if (!cancelled && err?.name !== 'RenderingCancelledException') setFailed(true)
      })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [pdf, pageNo, scale])
  if (failed) return <div className="rl-page-ph err">วาดหน้า {pageNo} ไม่ได้</div>
  return <canvas ref={ref} className="rl-canvas" style={{ width, height }} aria-label={`PDF หน้า ${pageNo}`} />
}

export default LinkPdfPane
