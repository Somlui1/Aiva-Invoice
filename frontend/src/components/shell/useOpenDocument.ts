/**
 * v5.14 — open a document on the page it belongs to (moved out of CommandPalette so the AP page and
 * the closed page use the same logic). See src/lib/openDocument.ts.
 */
import { useCallback } from 'react'
import { isClosedViewStatus } from '../../lib/closedDocs'
import { useAuth } from '../../context/AuthContext'
import { useInvoices } from '../../context/InvoiceContext'
import { useToastModal } from '../../context/ToastModalContext'
import { CLOSED_STATUSES, filterDocsFor } from '../../lib/queueFilters'
import type { PageKey } from '../layout/Sidebar'
import type { InvoiceDoc } from '../../types/invoice'

export function useOpenDocument(onNavigate: (page: PageKey) => void) {
  const inv = useInvoices()
  const { currentUser } = useAuth()
  const { toast } = useToastModal()

  return useCallback(
    (target: InvoiceDoc | string, opts: { pdf?: boolean } = {}): boolean => {
      const d = typeof target === 'string' ? inv.visibleDocs.find(x => x.doc === target) : target
      if (!d) {
        toast(`ไม่พบ ${typeof target === 'string' ? target : ''} ในขอบเขตสิทธิ์ของคุณ`, true)
        return false
      }
      // closed documents live on their own page (it opens the PDF itself once the row is selected)
      if (isClosedViewStatus(d.status)) {
        inv.focusClosedDoc(d.doc, !!opts.pdf)
        onNavigate('closed')
        return true
      }
      onNavigate('queue')
      const base = {
        docs: inv.visibleDocs,
        companyFilter: inv.companyFilter,
        periodFilter: inv.periodFilter,
        searchQuery: inv.searchQuery,
        showClosed: inv.showClosed,
        statusFilter: inv.statusFilter,
        role: currentUser.role,
      }
      const inList = (o: Partial<typeof base>, receiver: string | null = null) =>
        filterDocsFor({ ...base, ...o }).some(x => x.doc === d.doc) &&
        (currentUser.role !== 'EU' || !receiver || d.receiver === receiver)

      if (!inList({}, inv.receiverFilter)) {
        const cleared = {
          companyFilter: new Set<string>(),
          periodFilter: { k: 'all' } as typeof base.periodFilter,
          searchQuery: '',
          statusFilter: currentUser.role === 'EU' ? 'mine' : 'all',
        }
        inv.clearFilters()
        let showClosed = inv.showClosed
        if (!inList(cleared) && CLOSED_STATUSES.includes(d.status) && !showClosed) {
          inv.toggleShowClosed()
          showClosed = true
        }
        if (!inList({ ...cleared, showClosed })) inv.setStatusFilter(d.status)
        toast(`ปรับตัวกรองคิวเพื่อเปิดเอกสาร ${d.inv}`)
      }
      inv.selectDoc(d.doc)
      if (opts.pdf) inv.openEvidenceDock(1)
      return true
    },
    [inv, currentUser.role, onNavigate, toast],
  )
}
