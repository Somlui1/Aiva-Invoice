import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const batches = await prisma.apBatch.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ ok: true, batches })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role') || 'EU'
    const userId = req.headers.get('x-user-id') || 'unknown'
    const rawUserName = req.headers.get('x-user-name') || userId
    const userName = decodeURIComponent(rawUserName)

    // Authorization guard: only APR (Accounting Supervisor) or ADM can send batches
    if (!['APR', 'ADM'].includes(role)) {
      return NextResponse.json(
        { ok: false, error: 'ไม่มีสิทธิ์ส่งเอกสารเข้า AP Interface (ต้องเป็นระดับหัวหน้าฝ่ายบัญชี)' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { documentIds, companyCode } = body
    let { batchId } = body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'ต้องเลือกเอกสารอย่างน้อย 1 ฉบับเพื่อสร้าง Batch' },
        { status: 400 }
      )
    }

    // Load documents
    const docs = await prisma.document.findMany({
      where: { id: { in: documentIds } },
    })

    if (docs.length !== documentIds.length) {
      return NextResponse.json(
        { ok: false, error: 'พบเอกสารบางฉบับที่ไม่ปรากฏในระบบ' },
        { status: 404 }
      )
    }

    // Verify confirmation and locking state
    const lockedDocs = docs.filter(d => d.isLocked)
    if (lockedDocs.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `เอกสาร ${lockedDocs.map(d => d.id).join(', ')} ถูกล็อกอยู่ ไม่สามารถส่งซ้ำได้`,
        },
        { status: 423 }
      )
    }

    const unconfirmed = docs.filter(d => d.status !== 'Confirmed')
    if (unconfirmed.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `เอกสาร ${unconfirmed.map(d => d.id).join(', ')} ยังไม่ได้รับการ Confirm`,
        },
        { status: 400 }
      )
    }

    // Generate batch ID if not given
    if (!batchId) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randNum = Math.floor(Math.random() * 900 + 100)
      batchId = `AP-${todayStr}-${randNum}`
    }

    const totalAmount = docs.reduce((acc, d) => acc + d.grandTotal, 0)
    const effectiveCompany = companyCode || docs[0]?.companyCode || 'AH'

    // Build staged Oracle interface payload
    const stagedPayload = docs.map(d => ({
      BATCH_ID: batchId,
      INVOICE_NUM: d.invoiceNum,
      INVOICE_DATE: d.invoiceDate,
      VENDOR_TAX_ID: d.supplierTaxId,
      VENDOR_NAME: d.supplierName,
      COMPANY_CODE: d.companyCode,
      RECEIPT_NUM: d.receiptNum,
      RECEIVER_NAME: d.receiverName,
      TOTAL_AMOUNT: d.grandTotal,
      DMS_DOC_ID: d.dmsDocId,
      STAGED_AT: new Date().toISOString(),
    }))

    const now = new Date()
    const nowTimeStr = now.toTimeString().slice(0, 8)
    const dateStr = now.toISOString().slice(0, 10)

    // Execute atomic transaction
    const [batch] = await prisma.$transaction([
      prisma.apBatch.create({
        data: {
          id: batchId,
          status: 'SENT',
          totalDocs: docs.length,
          totalAmount,
          companyCode: effectiveCompany,
          createdBy: userId,
          sentAt: now,
          payloadJson: JSON.stringify(stagedPayload),
        },
      }),
      prisma.document.updateMany({
        where: { id: { in: documentIds } },
        data: {
          status: 'Sent',
          isLocked: true,
          lockedAt: now,
          lockedBy: userId,
          apBatchId: batchId,
        },
      }),
      // Audit logs for each document
      ...docs.map(d => {
        let history: any[] = []
        try {
          const parsed = JSON.parse(d.payloadJson)
          history = Array.isArray(parsed.history) ? parsed.history : []
        } catch {}

        history.push({
          dt: dateStr,
          t: nowTimeStr,
          who: userName,
          act: `ส่งเข้า AP Interface (${batchId})`,
          d: `ส่งโดย ${userName} (หัวหน้าฝ่ายบัญชี)`,
          k: 'g',
        })

        return prisma.auditLog.create({
          data: {
            who: userName,
            role,
            docId: d.id,
            act: 'ส่งเข้า AP Interface',
            action: 'send_ap_batch',
            fromStatus: d.status,
            toStatus: 'Sent',
            detail: `Batch ${batchId} · ยอดรวม ${d.grandTotal.toLocaleString()} ฿`,
          },
        })
      }),
    ])

    return NextResponse.json({
      ok: true,
      batch: {
        id: batch.id,
        status: batch.status,
        totalDocs: batch.totalDocs,
        totalAmount: batch.totalAmount,
        sentAt: batch.sentAt,
      },
      documentIds,
      stagedPayload,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
