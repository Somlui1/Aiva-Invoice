import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../app/api/notifications/poll/route'
import { prisma } from '../lib/prisma'

describe('GET /api/notifications/poll & Ingestion Audit Log Scoping', () => {
  const testDocId = 'DMS-POLL-1'

  beforeEach(async () => {
    const now = new Date()
    await prisma.document.upsert({
      where: { id: testDocId },
      create: {
        id: testDocId,
        dmsDocId: testDocId,
        packageId: 'PKG-1',
        fileSha256: 'sha-poll-1',
        pageCount: 1,
        invoiceNum: 'INV-POLL-1',
        invoiceDate: '2026-10-16',
        companyCode: 'AH',
        supplierTaxId: '0105500000001',
        supplierName: 'AAPICO Test Supplier',
        grandTotal: 15000,
        status: 'Auto-pass',
        recommendation: 'AUTO_PASS',
        maxSeverity: 'Low',
        payloadJson: '{}',
        createdAt: now,
      },
      update: {
        createdAt: now,
      },
    })
  })

  it('returns documents created after since parameter for authorized company', async () => {
    const pastIso = new Date(Date.now() - 60000).toISOString()
    const req = new Request(
      `http://localhost:3000/api/notifications/poll?since=${encodeURIComponent(pastIso)}&role=APR&companies=AH`
    )
    const res = await GET(req as any)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.newDocuments.some((d: any) => d.id === testDocId)).toBe(true)
  })

  it('does NOT return documents for unauthorized company', async () => {
    const pastIso = new Date(Date.now() - 60000).toISOString()
    const req = new Request(
      `http://localhost:3000/api/notifications/poll?since=${encodeURIComponent(pastIso)}&role=APR&companies=AHP`
    )
    const res = await GET(req as any)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.newDocuments.some((d: any) => d.id === testDocId)).toBe(false)
  })

  it('allows SA and ADM to receive documents from all companies', async () => {
    const pastIso = new Date(Date.now() - 60000).toISOString()
    const req = new Request(
      `http://localhost:3000/api/notifications/poll?since=${encodeURIComponent(pastIso)}&role=SA`
    )
    const res = await GET(req as any)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.newDocuments.some((d: any) => d.id === testDocId)).toBe(true)
  })
})
