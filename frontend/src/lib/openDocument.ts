/**
 * v5.14 — "open this document" from anywhere (AP page invoice link, closed-page references …).
 * Pages do not know where a document lives; they dispatch this request and the shell (App) decides:
 *   closed statuses (Confirmed / Sent / Posted / Rejected / Superseded / Duplicate) → เอกสารที่ปิดแล้ว
 *   everything else (Auto-pass … Manual Review, Import Failed)                     → คิวตรวจสอบ
 * then selects it (adjusting the queue filters when they hide it) and opens the PDF preview.
 */
export const OPEN_DOC_EVENT = 'aiva:open-doc'

export interface OpenDocRequest {
  id: string
  /** open the PDF preview side panel too (default true) */
  pdf?: boolean
}

export function requestOpenDocument(id: string, opts: { pdf?: boolean } = {}): void {
  if (typeof window === 'undefined' || !id) return
  window.dispatchEvent(new CustomEvent<OpenDocRequest>(OPEN_DOC_EVENT, { detail: { id, pdf: opts.pdf ?? true } }))
}
