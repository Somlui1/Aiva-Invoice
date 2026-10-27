'use client'

/**
 * Loads a document through the Task 6 streaming proxy and paints the current
 * page onto a canvas with PDF.js (design §4.2).
 *
 * Two rules drive the whole component:
 *
 *  1. **Never blank.** While the PDF is in flight, or if it never arrives, the
 *     caller keeps rendering the mock page. `status.mode` says which surface is
 *     authoritative, so the switch is one boolean in the dock.
 *  2. **One geometry.** The overlay is positioned from `pageSize` — the CSS
 *     pixel size of the page *as PDF.js rendered it* — so zoom, page size and
 *     device pixel ratio can change together without the boxes drifting.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
// Type-only: erased at compile time, so this does not evaluate the module.
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'
import { devicePixelSize, scaleToFitWidth, type SizeBox } from '../lib/coordinateTransform'
import type { PdfProxySource, PdfViewerStatus } from '../types'

/** Copied out of `node_modules/pdfjs-dist/build` by `scripts/copy-pdfjs-worker.mjs`. */
export const PDFJS_WORKER_SRC = '/pdfjs/pdf.worker.min.mjs'

let workerConfigured = false
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

/**
 * Load PDF.js and point it at the locally served worker.
 *
 * PDF.js is browser-only: it touches `DOMMatrix` while its module is being
 * evaluated, and a `'use client'` module is still evaluated during server
 * rendering (and inside a node test worker) — so it is imported dynamically from
 * inside the effects below, which only ever run in the browser. The promise is
 * cached, which also keeps the ~1 MB viewer out of the initial bundle.
 *
 * Next.js cannot bundle a `new URL('…', import.meta.url)` worker, which is why
 * the worker file lives in `public/` instead.
 */
export function loadPdfjs(src: string = PDFJS_WORKER_SRC): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then(mod => {
      if (!workerConfigured) {
        mod.GlobalWorkerOptions.workerSrc = src
        workerConfigured = true
      }
      return mod
    })
    // A failed load must not be cached, or a retry could never recover.
    pdfjsPromise.catch(() => {
      pdfjsPromise = null
    })
  }
  return pdfjsPromise
}

const INITIAL_STATUS: PdfViewerStatus = {
  state: 'loading',
  mode: 'mock',
  pageCount: 1,
}

const EMPTY_PAGE: SizeBox = { width: 0, height: 0 }

/**
 * The canvas is painted at device pixels so text stays sharp on hi-dpi screens;
 * the overlay is positioned in CSS pixels, and the ratio between the two is the
 * render transform. Only ever called from an effect, i.e. in the browser.
 */
function resolveDevicePixelRatio(explicit?: number): number {
  if (explicit && explicit > 0) return explicit
  return typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
}

export interface UsePdfViewerArgs {
  /** Document shown in the dock; `null` releases everything. */
  documentId: string | null
  /** CSS px available for the page (the dock's measured width). */
  containerWidth: number
  /** 1-based page number. */
  page: number
  /** Degrees from the rotate button; added to the page's own `/Rotate`. */
  rotation: number
  /** Zoom multiplier on top of fit-to-width. */
  zoom: number
  /** Device pixel ratio for the canvas backing store; read from the window when omitted. */
  devicePixelRatio?: number
}

export interface UsePdfViewerResult {
  status: PdfViewerStatus
  /** Canvas the current page is painted on. Hidden while `status.mode === 'mock'`. */
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** CSS px size of the rendered page — the overlay's surface. */
  pageSize: SizeBox
  /** Re-fetch the document (used by the dock's retry affordance). */
  reload: () => void
  /** PDF.js is painting the visible page; the viewer shows a spinner instead of a half-drawn page. */
  rendering: boolean
}

export function generateRefCode(id: string | null): string {
  if (!id) return 'REF-GEN001'
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  const hex = Math.abs(h).toString(16).toUpperCase().padStart(6, '0').slice(-6)
  return `REF-${hex}`
}

export function usePdfViewer({
  documentId,
  containerWidth,
  page,
  rotation,
  zoom,
  devicePixelRatio,
}: UsePdfViewerArgs): UsePdfViewerResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null)
  const renderRef = useRef<{ cancel: () => void } | null>(null)

  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<PdfViewerStatus>(INITIAL_STATUS)
  const [pageSize, setPageSize] = useState<SizeBox>(EMPTY_PAGE)
  /** True while PDF.js paints the visible page (first paint, page turn, zoom, rotate). */
  const [rendering, setRendering] = useState(false)

  const reload = useCallback(() => setAttempt(n => n + 1), [])

  const fallBack = useCallback((reason: string, source?: PdfProxySource, docId?: string | null) => {
    const statusMatch = reason.match(/\b(400|401|403|404|500|502|503|504)\b/)
    const httpCode = statusMatch ? `DMS-${statusMatch[1]}` : 'DMS-500'
    const isNotFound = httpCode === 'DMS-404' || reason.toLowerCase().includes('not found')
    const isAuth = httpCode === 'DMS-401' || httpCode === 'DMS-403'
    const isExpired = httpCode === 'DMS-401'
    const code = isNotFound ? 'DMS-404' : httpCode
    const retryable = !isNotFound && !isAuth
    const message = isNotFound
      ? 'ไม่พบไฟล์เอกสารในระบบจัดเก็บเอกสาร (DMS)'
      : isExpired
        ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
        : isAuth
        ? 'ไม่มีสิทธิ์เข้าถึงเอกสารนี้ในระบบ DMS'
        : 'การเชื่อมต่อเซิร์ฟเวอร์ DMS ขัดข้อง หรือหมดเวลาการเชื่อมต่อ'
    const ref = generateRefCode(docId ?? null)

    setStatus({
      state: 'error',
      mode: 'mock',
      reason,
      source,
      pageCount: 1,
      error: {
        code,
        ref,
        message,
        retryable,
      },
    })
    setPageSize(EMPTY_PAGE)
  }, [])

  // --- 1. fetch + parse -----------------------------------------------------
  useEffect(() => {
    let disposed = false
    let opened: PDFDocumentProxy | null = null
    let task: PDFDocumentLoadingTask | null = null

    pdfRef.current = null
    setPageSize(EMPTY_PAGE)
    setRendering(false)
    if (!documentId) {
      setStatus(INITIAL_STATUS)
      return
    }
    setStatus({ ...INITIAL_STATUS, mode: 'mock' })

    void (async () => {
      try {
        const { getDocument } = await loadPdfjs()

        // The proxy decides DMS live → cache → simulated page and says which one
        // answered; `fallback_mock` means there is no PDF to draw.
        const res = await fetch(`/api/documents/${encodeURIComponent(documentId)}/pdf`, {
          cache: 'no-store',
          // The httpOnly aiva_session cookie must travel with it; a 401 here is caught by the
          // session interceptor (lib/session.ts) which sends the user to /login?expired=1.
          credentials: 'same-origin',
        })
        if (!res.ok) throw new Error(`PDF request failed (${res.status})`)

        const source = (res.headers.get('X-PDF-Source') ?? undefined) as PdfProxySource | undefined
        const reason = res.headers.get('X-PDF-Fallback-Reason') ?? undefined
        if (source === 'fallback_mock' || !res.headers.get('Content-Type')?.includes('pdf')) {
          throw new Error(reason || 'no PDF available for this document')
        }

        const data = new Uint8Array(await res.arrayBuffer())
        task = getDocument({ data })
        taskRef.current = task
        opened = await task.promise
        if (disposed) {
          void opened.destroy()
          return
        }
        pdfRef.current = opened
        setStatus({
          state: 'ready',
          mode: 'pdf',
          source,
          pageCount: Math.max(1, opened.numPages),
        })
      } catch (err) {
        if (disposed) return
        fallBack(err instanceof Error ? err.message : String(err), undefined, documentId)
      }
    })()

    return () => {
      disposed = true
      renderRef.current?.cancel()
      renderRef.current = null
      const destroyDoc = opened ?? pdfRef.current
      pdfRef.current = null
      if (destroyDoc) void destroyDoc.destroy()
      else if (task) void task.promise.then(d => d.destroy()).catch(() => undefined)
      taskRef.current = null
    }
  }, [documentId, attempt, fallBack])

  // --- 2. render the visible page -------------------------------------------
  useEffect(() => {
    if (status.state !== 'ready') return
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return

    let disposed = false
    const pageNumber = Math.min(Math.max(1, page), pdf.numPages)
    setRendering(true)

    void (async () => {
      try {
        const pdfPage = await pdf.getPage(pageNumber)
        if (disposed) return

        // The Engine measured its boxes on the page as the PDF itself turns it
        // (PyMuPDF's `page.rect`, `engine/src/system_a/perception/pdf_ingest.py`),
        // and PDF.js applies `/Rotate` the same way — so only the viewer's own
        // rotation still has to be composed here for canvas and overlay to agree.
        const totalRotation = rotation + pdfPage.rotate
        const [x0, y0, x1, y1] = pdfPage.view
        const widthPt = Math.abs(x1 - x0)
        const heightPt = Math.abs(y1 - y0)
        const cssWidth = Math.max(1, containerWidth)

        const scale = scaleToFitWidth(widthPt, heightPt, { cssWidth, rotation: totalRotation }) * zoom
        const viewport = pdfPage.getViewport({ scale, rotation: totalRotation })

        // The canvas keeps the device pixels for sharpness; CSS keeps the layout
        // size, which is what the overlay is positioned against.
        const backing = devicePixelSize(
          { width: viewport.width, height: viewport.height },
          resolveDevicePixelRatio(devicePixelRatio),
        )
        const sx = backing.width / viewport.width
        const sy = backing.height / viewport.height
        canvas.width = backing.width
        canvas.height = backing.height
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        // PDF.js v5 leaves the canvas backing size to the caller and applies
        // `transform` on top of the viewport, so the device-pixel scale goes in
        // as the transform.
        renderRef.current?.cancel()
        const task = pdfPage.render({ canvas, viewport, transform: [sx, 0, 0, sy, 0, 0] })
        renderRef.current = task
        await task.promise
        renderRef.current = null
        if (disposed) return

        setRendering(false)
        setPageSize(prev =>
          Math.abs(prev.width - viewport.width) < 0.5 && Math.abs(prev.height - viewport.height) < 0.5
            ? prev
            : { width: viewport.width, height: viewport.height },
        )
      } catch (err) {
        if (disposed) return
        renderRef.current = null
        setRendering(false)
        // A page that cannot be painted is worse than no PDF at all: the mock
        // page keeps the analyst working, and the badge says why.
        fallBack(err instanceof Error ? err.message : String(err), status.source, documentId)
      }
    })()

    return () => {
      disposed = true
      renderRef.current?.cancel()
      renderRef.current = null
    }
  }, [status.state, status.source, page, rotation, zoom, containerWidth, devicePixelRatio, fallBack])
  return { status, canvasRef, pageSize, reload, rendering }
}
