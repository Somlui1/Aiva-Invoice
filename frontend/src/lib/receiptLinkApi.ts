/**
 * v5.11 — browser calls for the "ผูกใบรับ" screen. Every write sends `version`; a 409 means the
 * document changed after the screen was opened (the screen asks for a reload, never retries).
 */
import type { ConfirmEvaluation, LinkInput, ReceiptLookup } from './receiptLink'
import type { LinePair } from './approxLineMatch'
import type { InvoiceDoc, PortalManualValue, PortalReceiptLink } from '../types/invoice'

export interface LinkContext {
  ok: true
  version: string
  lookup: ReceiptLookup
  evaluation: ConfirmEvaluation
  pairs: LinePair[]
  canOpen: { ok: boolean; why?: string }
  savedLink: PortalReceiptLink | null
  manualValues: PortalManualValue[]
  document?: InvoiceDoc | null
}

export type LinkOp = 'save' | 'confirm' | 'hold' | 'reject' | 'close_duplicate'

export interface ApiFail {
  ok: false
  status: number
  code: string
  error: string
  duplicateOf?: string
  evaluation?: ConfirmEvaluation
}

async function call<T>(url: string, init?: RequestInit): Promise<T | ApiFail> {
  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body?.ok === false) {
      return { ok: false, status: res.status, code: body?.code ?? `HTTP_${res.status}`, error: body?.error ?? `HTTP ${res.status}`, duplicateOf: body?.duplicateOf, evaluation: body?.evaluation }
    }
    return body as T
  } catch (err: any) {
    return { ok: false, status: 0, code: 'NETWORK', error: err?.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' }
  }
}

const docUrl = (id: string) => `/api/documents/${encodeURIComponent(id)}`

export const fetchLinkContext = (id: string) => call<LinkContext>(`${docUrl(id)}/link`)

export const evaluateLink = (id: string, input: LinkInput) =>
  call<LinkContext>(`${docUrl(id)}/link/evaluate`, { method: 'POST', body: JSON.stringify(input) })

export const writeLink = (id: string, op: LinkOp, version: string, input: LinkInput) =>
  call<{ ok: true; message: string; version: string; document: InvoiceDoc | null }>(`${docUrl(id)}/link`, {
    method: 'POST',
    body: JSON.stringify({ ...input, op, version }),
  })

export const isFail = (x: unknown): x is ApiFail => !!x && typeof x === 'object' && (x as any).ok === false
