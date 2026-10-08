import { NextResponse } from 'next/server'
import { INITIAL_DOCS } from '@/mock/initialDocs'

export async function GET() {
  const portalUrl = process.env.TEST_PORTAL_URL || 'http://127.0.0.1:8090'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    const res = await fetch(`${portalUrl}/api/documents`, {
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ source: 'portal_live', documents: data })
    }
  } catch {
    // Portal engine offline
  }

  // Return formatted documents from initial docs
  return NextResponse.json({
    source: 'portal_local',
    documents: INITIAL_DOCS.map(d => ({
      id: d.doc,
      inv: d.inv,
      company: d.company,
      vendor: d.vendor,
      amount: d.total,
      po: d.po,
      rcv: d.rcv,
      status: d.status,
      receiver: d.receiver,
      pages: d.pages,
      codes: d.codes,
      date: d.dt
    }))
  })
}
