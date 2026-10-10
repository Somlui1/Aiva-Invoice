/**
 * Viewer modes for the evidence dock (design §4.2).
 *
 * `mock` is not an error state: while the PDF is still arriving, or when the
 * Task 6 proxy had to hand back the simulated document, the dock keeps drawing
 * `EvidenceCanvas` so an analyst never stares at a blank panel.
 */
export type PdfViewMode = 'pdf' | 'mock'

export type PdfViewerState = 'loading' | 'ready' | 'fallback' | 'error'

/** `X-PDF-Source` values emitted by `src/app/api/documents/[id]/pdf/route.ts`. */
export type PdfProxySource = 'dms_live' | 'cache' | 'fallback_mock'

export interface PdfViewerError {
  code: string
  ref: string
  message: string
  retryable: boolean
}

export interface PdfViewerStatus {
  state: PdfViewerState
  /** Which surface the dock should draw right now. */
  mode: PdfViewMode
  /** Where the bytes came from, straight from the proxy header. */
  source?: PdfProxySource
  /** Why the viewer fell back (shown in the dock's badge). */
  reason?: string
  /** Pages of the document being shown. */
  pageCount: number
  /** Minimal error details when state is 'error'. */
  error?: PdfViewerError
}

