/**
 * Reading documents out of the Portal database (design §4.1, Task 8).
 *
 * The queue and the detail pane used to be handed `INITIAL_DOCS`, an array typed
 * into the source tree. Everything in this module exists to replace that with
 * rows: load the row, re-hydrate the Portal contract that ingestion stored in
 * `Document.payloadJson`, and map it to the shape the UI was built against.
 *
 * Two rules worth stating:
 *
 *  • **The stored payload is the source of detail.** The columns on `Document`
 *    are an index (they make filtering cheap and are what the ingest wrote);
 *    rules, line items, boxes and history only exist in the JSON. Reading the
 *    columns and guessing at the rest would quietly lose the evidence trail.
 *  • **One row that will not parse is one bad row, not a broken queue.** It is
 *    reported and skipped, so a single corrupt document cannot take the whole
 *    analyst queue down.
 */
import { prisma } from '@/lib/prisma'
import { portalDocToInvoiceDoc, type PortalToUiOptions } from '@/features/engine/adapters/portalDocToInvoiceDoc'
import type { PortalInvoiceDocument } from '@/features/engine/types/portalDomain'
import type { InvoiceDoc } from '@/types/invoice'

/** Portal document ids are `DMS-<digits>`; nothing else is a valid lookup. */
export const SAFE_DOC_ID = /^DMS-\d{1,7}$/

export interface QueueFilters {
  companyCode?: string
}

interface Row {
  id: string
  payloadJson: string
}

/** The stored Portal contract, or `null` when the row's JSON is unusable. */
export function parsePortalPayload(row: Row): PortalInvoiceDocument | null {
  try {
    const parsed = JSON.parse(row.payloadJson) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const doc = parsed as PortalInvoiceDocument
    // The id inside the payload has to agree with the row it was read from, or
    // the queue would show a document under the wrong identity.
    if (doc.id !== row.id || typeof doc.id !== 'string') return null
    if (!Array.isArray(doc.rules) || !Array.isArray(doc.bboxes)) return null
    return doc
  } catch {
    return null
  }
}

/**
 * The queue rows, mapped for the UI. Rows whose payload cannot be parsed are
 * dropped and named in `skipped`, which the route surfaces as a warning header —
 * a partially readable queue must still be visibly partial.
 */
export async function loadQueueDocs(
  filters: QueueFilters = {},
  opts: PortalToUiOptions = { includeBoxes: false },
): Promise<{ docs: InvoiceDoc[]; skipped: string[] }> {
  const rows = await prisma.document.findMany({
    where: filters.companyCode ? { companyCode: filters.companyCode } : undefined,
    // Ordered by identity, not by date: the queue's date order (and its
    // tiebreak) is applied after mapping, so the database only has to be stable.
    orderBy: { id: 'asc' },
    select: { id: true, payloadJson: true },
  })

  const docs: InvoiceDoc[] = []
  const skipped: string[] = []
  for (const row of rows) {
    const portal = parsePortalPayload(row)
    if (!portal) {
      skipped.push(row.id)
      continue
    }
    docs.push(portalDocToInvoiceDoc(portal, opts))
  }
  return { docs, skipped }
}

/** One document, with its evidence boxes attached. `null` means no such row. */
export async function loadQueueDoc(id: string): Promise<InvoiceDoc | null> {
  const row = await prisma.document.findUnique({
    where: { id },
    select: { id: true, payloadJson: true },
  })
  if (!row) return null
  const portal = parsePortalPayload(row)
  if (!portal) throw new UnreadableDocumentError(id)
  return portalDocToInvoiceDoc(portal, { includeBoxes: true })
}

/** The row exists but its stored payload is not readable JSON. */
export class UnreadableDocumentError extends Error {
  constructor(public readonly docId: string) {
    super(`เอกสาร ${docId} มีข้อมูลต้นทางที่อ่านไม่ได้ (payloadJson เสียหาย)`)
    this.name = 'UnreadableDocumentError'
  }
}
