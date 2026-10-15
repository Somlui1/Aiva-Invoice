import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CallbackResultItem {
  documentId: string
  success: boolean
  oracleInvoiceId?: string
  error?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params
    const body = await req.json()
    const { results } = body as { results: CallbackResultItem[] }

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'ต้องระบุผลลัพธ์ของเอกสารอย่างน้อย 1 รายการ' },
        { status: 400 }
      )
    }

    const batch = await prisma.apBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return NextResponse.json({ ok: false, error: `ไม่พบ Batch ID ${batchId}` }, { status: 404 })
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const nowTimeStr = now.toTimeString().slice(0, 8)

    let successCount = 0
    let failureCount = 0

    // Process each document result in a transaction
    await prisma.$transaction(async tx => {
      for (const res of results) {
        const doc = await tx.document.findUnique({
          where: { id: res.documentId },
        })

        if (!doc) continue

        let history: any[] = []
        try {
          const parsed = JSON.parse(doc.payloadJson)
          history = Array.isArray(parsed.history) ? parsed.history : []
        } catch {}

        if (res.success) {
          successCount++
          history.push({
            dt: dateStr,
            t: nowTimeStr,
            who: 'Oracle AP Interface',
            act: 'Import สำเร็จ',
            d: `Oracle Invoice ID: ${res.oracleInvoiceId || '—'}`,
            k: 'g',
          })

          await tx.document.update({
            where: { id: res.documentId },
            data: {
              status: 'Posted',
              oracleInvoiceId: res.oracleInvoiceId || null,
              importError: null,
              isLocked: true, // Remains locked once posted in Oracle AP
              payloadJson: JSON.stringify({
                ...JSON.parse(doc.payloadJson || '{}'),
                history,
              }),
            },
          })

          await tx.auditLog.create({
            data: {
              who: 'Oracle AP Interface',
              role: 'SYSTEM',
              docId: res.documentId,
              act: 'Oracle AP Import สำเร็จ',
              action: 'oracle_ap_sync',
              fromStatus: doc.status,
              toStatus: 'Posted',
              detail: `Oracle Invoice ID: ${res.oracleInvoiceId || '—'}`,
            },
          })
        } else {
          failureCount++
          history.push({
            dt: dateStr,
            t: nowTimeStr,
            who: 'Oracle AP Interface',
            act: 'Import ไม่ผ่าน',
            d: res.error || 'Interface Validation Error',
            k: 'c',
          })

          await tx.document.update({
            where: { id: res.documentId },
            data: {
              status: 'Import Failed',
              importError: res.error || 'Interface Validation Error',
              isLocked: false, // Unlocked so user can fix or return to review
              payloadJson: JSON.stringify({
                ...JSON.parse(doc.payloadJson || '{}'),
                history,
              }),
            },
          })

          await tx.auditLog.create({
            data: {
              who: 'Oracle AP Interface',
              role: 'SYSTEM',
              docId: res.documentId,
              act: 'Oracle AP Import ไม่ผ่าน',
              action: 'oracle_ap_fail',
              fromStatus: doc.status,
              toStatus: 'Import Failed',
              detail: res.error || 'Interface Validation Error',
            },
          })
        }
      }

      // Determine batch overall status
      let newBatchStatus = 'PARTIAL'
      if (failureCount === 0 && successCount > 0) {
        newBatchStatus = 'SYNCED'
      } else if (successCount === 0 && failureCount > 0) {
        newBatchStatus = 'FAILED'
      }

      await tx.apBatch.update({
        where: { id: batchId },
        data: { status: newBatchStatus },
      })
    })

    const finalBatch = await prisma.apBatch.findUnique({
      where: { id: batchId },
    })

    return NextResponse.json({
      ok: true,
      batch: finalBatch,
      summary: {
        success: successCount,
        failure: failureCount,
        total: results.length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
