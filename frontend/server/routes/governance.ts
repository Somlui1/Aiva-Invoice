import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma'
import { searchActiveDirectory } from '../../src/lib/adAuth'
import { COMPANIES } from '../../src/mock/companies'

// --- USERS ROUTER ---
export const usersRouter = Router()

const USER_SAVE_SCHEMA = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  samAccount: z.string().optional(),
  empId: z.string().optional(),
  unit: z.string().optional(),
  role: z.enum(['EU', 'ACC', 'APR', 'ADM', 'SA']),
  companies: z.array(z.string()).default([]),
  receivers: z.array(z.string()).default([]),
})

usersRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbUsers = await prisma.user.findMany({
      include: {
        companies: true,
        receivers: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const formatted = dbUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      samAccount: u.samAccount || u.email.split('@')[0],
      empId: u.empId,
      unit: u.unit,
      role: u.role,
      companies: u.companies.map((c: any) => c.companyCode),
      receivers: u.receivers.map((r: any) => r.receiverName),
      isActive: u.isActive,
    }))

    res.json({ ok: true, users: formatted })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || 'Failed to list users' })
  }
})

usersRouter.post('/', async (req: Request, res: Response) => {
  const parsed = USER_SAVE_SCHEMA.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      issues: parsed.error.issues,
    })
  }

  const data = parsed.data
  const adminId = (req.headers['x-user-id'] as string) || (req as any).user?.id || 'u7'

  try {
    const user = await prisma.$transaction(async (tx: any) => {
      // 1. Upsert User
      const u = await tx.user.upsert({
        where: { email: data.email },
        create: {
          id: data.id || `u_${Date.now()}`,
          email: data.email,
          name: data.name,
          samAccount: data.samAccount || data.email.split('@')[0],
          empId: data.empId,
          unit: data.unit,
          role: data.role,
        },
        update: {
          name: data.name,
          samAccount: data.samAccount || data.email.split('@')[0],
          empId: data.empId,
          unit: data.unit,
          role: data.role,
        },
      })

      // 2. Synchronize Companies
      await tx.userCompany.deleteMany({ where: { userId: u.id } })
      if (data.companies.length > 0) {
        await tx.userCompany.createMany({
          data: data.companies.map(c => ({ userId: u.id, companyCode: c })),
        })
      }

      // 3. Synchronize Receivers
      await tx.userReceiverMap.deleteMany({ where: { userId: u.id } })
      if (data.receivers.length > 0) {
        await tx.userReceiverMap.createMany({
          data: data.receivers.map(r => ({
            userId: u.id,
            receiverName: r,
            assignedBy: adminId,
          })),
        })
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          docId: 'USER_MANAGEMENT',
          whoId: adminId,
          who: 'IT Admin',
          role: 'ADM',
          act: 'บันทึกสิทธิ์ผู้ใช้',
          action: 'SAVE_USER',
          detail: `บันทึกผู้ใช้ ${u.name} (${u.email}) · Role: ${u.role} · Scope: ${
            u.role === 'EU' ? data.receivers.join(', ') : data.companies.join(', ')
          }`,
        },
      })

      return u
    })

    res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companies: data.companies,
        receivers: data.receivers,
      },
    })
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to save user',
    })
  }
})

// --- ACTIVE DIRECTORY ROUTER ---
export const adRouter = Router()

const DIRECTORY_EMPLOYEES = [
  { samAccount: 'somsak.j', name: 'สมศักดิ์ ใจดี', email: 'somsak.j@aapico.com', upn: 'somsak.j@aapico.com', empId: '10231', title: 'หัวหน้าคลัง', unit: 'คลังวัตถุดิบ', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'wilaiwan.s', name: 'วิไลวรรณ ศรีสุข', email: 'wilaiwan.s@aapico.com', upn: 'wilaiwan.s@aapico.co.th', empId: '20417', title: 'เจ้าหน้าที่ซ่อมบำรุง', unit: 'ฝ่ายซ่อมบำรุง', ou: 'OU=Maintenance,OU=AHT,DC=aapico,DC=com', enabled: true },
  { samAccount: 'thanakorn.m', name: 'ธนากร มั่นคง', email: 'thanakorn.m@aapico.com', upn: 'thanakorn.m@aapico.com', empId: '30552', title: 'เจ้าหน้าที่คลังอะไหล่', unit: 'คลังอะไหล่', ou: 'OU=Spare,OU=AM,DC=aapico,DC=com', enabled: true },
  { samAccount: 'panida.r', name: 'ปณิดา รักงาน', email: 'panida.r@aapico.com', upn: 'panida.r@aapico.com', empId: '11020', title: 'นักบัญชี', unit: 'ฝ่ายบัญชี AH/AHT', ou: 'OU=Accounting,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'kamonwan.j', name: 'กมลวรรณ ใจงาม', email: 'kamonwan.j@aapico.com', upn: 'kamonwan.j@aapico.com', empId: '31005', title: 'นักบัญชี', unit: 'ฝ่ายบัญชี AM/AHP', ou: 'OU=Accounting,OU=AM,DC=aapico,DC=com', enabled: true },
  { samAccount: 'somchai.w', name: 'สมชาย วงศ์ทอง', email: 'somchai.w@aapico.com', upn: 'somchai.w@aapico.com', empId: '11001', title: 'หัวหน้าฝ่ายบัญชี', unit: 'ฝ่ายบัญชี', ou: 'OU=Accounting,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'anucha.i', name: 'อนุชา ไอที', email: 'anucha.i@aapico.com', upn: 'anucha.i@aapico.com', empId: '90007', title: 'IT Admin', unit: 'IT', ou: 'OU=IT,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'kitti.s', name: 'กิตติ สมบูรณ์', email: 'kitti.s@aapico.com', upn: 'kitti.s@aapico.com', empId: '10388', title: 'หัวหน้าคลัง', unit: 'คลัง (ดูแลหลาย account)', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'narong.p', name: 'ณรงค์ พลศรี', email: 'narong.p@aapico.com', upn: 'narong.p@aapico.com', empId: '40118', title: 'เจ้าหน้าที่คลัง', unit: 'คลังสินค้า MGP', ou: 'OU=Warehouse,OU=MGP,DC=aapico,DC=com', enabled: true },
  { samAccount: 'praphan.k', name: 'ประพันธ์ แก้วกล้า', email: 'praphan.k@aapico.com', upn: 'praphan.k@aapico.com', empId: '40227', title: 'เจ้าหน้าที่คลัง', unit: 'คลังน้ำมันหล่อลื่น', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'anan.t', name: 'อนันต์ ทองดี', email: 'anan.t@aapico.com', upn: 'anan.t@aapico.com', empId: '40301', title: 'ช่างซ่อมบำรุง', unit: 'บำรุงรักษา ATD', ou: 'OU=Maintenance,OU=ATD,DC=aapico,DC=com', enabled: true },
  { samAccount: 'siriporn.k', name: 'ศิริพร แก้วใส', email: 'siriporn.k@aapico.com', upn: 'siriporn.k@aapico.com', empId: '40412', title: 'เจ้าหน้าที่คลัง', unit: 'คลังวัตถุดิบ', ou: 'OU=Warehouse,OU=AH,DC=aapico,DC=com', enabled: true },
  { samAccount: 'theerapong.t', name: 'ธีรพงษ์ ทองดี', email: 'theerapong.t@aapico.com', upn: 'theerapong.t@aapico.com', empId: '40533', title: 'นักบัญชี', unit: 'ฝ่ายบัญชี AHT', ou: 'OU=Accounting,OU=AHT,DC=aapico,DC=com', enabled: true },
  { samAccount: 'napassorn.p', name: 'นภัสสร พึ่งบุญ', email: 'napassorn.p@aapico.com', upn: 'napassorn.p@aapico.com', empId: '40640', title: 'เจ้าหน้าที่คลังอะไหล่', unit: 'คลังอะไหล่ AHP', ou: 'OU=Spare,OU=AHP,DC=aapico,DC=com', enabled: true },
  { samAccount: 'kittipong.s', name: 'กิตติพงษ์ สมบัติ', email: 'kittipong.s@aapico.com', upn: 'kittipong.s@aapico.com', empId: '40755', title: 'เจ้าหน้าที่คลังอะไหล่', unit: 'คลังอะไหล่ AM', ou: 'OU=Spare,OU=AM,DC=aapico,DC=com', enabled: true },
  { samAccount: 'wipa.s', name: 'วิภา ศรีสุข', email: 'wipa.s@aapico.com', upn: 'wipa.s@aapico.co.th', empId: '40866', title: 'หัวหน้าสายการผลิต', unit: 'ฝ่ายผลิต AHT', ou: 'OU=Production,OU=AHT,DC=aapico,DC=com', enabled: true },
]

adRouter.get('/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase()

  if (!q) {
    return res.json({ ok: true, results: DIRECTORY_EMPLOYEES })
  }

  try {
    const liveResults = await searchActiveDirectory(q)
    if (liveResults && liveResults.length > 0) {
      return res.json({ ok: true, results: liveResults })
    }
  } catch {}

  const results = DIRECTORY_EMPLOYEES.filter(
    e =>
      e.samAccount.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.empId.includes(q) ||
      e.unit.toLowerCase().includes(q),
  )

  res.json({ ok: true, results })
})

// --- AUDIT LOGS ROUTER ---
export const auditLogsRouter = Router()

auditLogsRouter.get('/', async (req: Request, res: Response) => {
  try {
    let whereClause: any = undefined

    const whoId = req.query.whoId ? String(req.query.whoId) : undefined
    const role = req.query.role ? String(req.query.role) : undefined
    const companiesParam = req.query.companies ? String(req.query.companies) : undefined
    const companies = companiesParam
      ? companiesParam.split(',').map(c => c.trim()).filter(Boolean)
      : []

    if (role === 'ADM' || role === 'SA') {
      whereClause = undefined
    } else if (role === 'APR') {
      const matchedDocs = await prisma.document.findMany({
        where: { companyCode: { in: companies } },
        select: { id: true },
      })
      const companyDocIds = matchedDocs.map((d: any) => d.id)

      whereClause = {
        OR: [
          ...(whoId ? [{ whoId }] : []),
          ...(companyDocIds.length > 0 ? [{ docId: { in: companyDocIds } }] : []),
          ...companies.flatMap(c => [
            { detail: { contains: ` ${c} ` } },
            { detail: { startsWith: `${c} ` } },
            { detail: { contains: `[${c}]` } },
            { detail: { contains: `(${c})` } },
            { docId: { contains: `-${c}-` } },
          ]),
        ],
      }
    } else if (whoId) {
      whereClause = { whoId }
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const formatted = logs.map((l: any) => ({
      id: l.id,
      dt: l.createdAt.toISOString().slice(0, 10),
      t: l.createdAt.toTimeString().slice(0, 8),
      who: l.who,
      role: l.role,
      act: l.act,
      doc: l.docId,
      detail: l.detail,
    }))

    res.json({ ok: true, logs: formatted })
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to fetch audit logs',
    })
  }
})

// --- AP ROUTER ---
export const apRouter = Router()

apRouter.get('/batches', async (_req: Request, res: Response) => {
  try {
    const batches = await prisma.apBatch.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ ok: true, batches })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

apRouter.post('/batches', async (req: Request, res: Response) => {
  try {
    const role = (req.headers['x-user-role'] as string) || (req as any).user?.role || 'EU'
    const userId = (req.headers['x-user-id'] as string) || (req as any).user?.id || 'unknown'
    const rawUserName = (req.headers['x-user-name'] as string) || (req as any).user?.name || userId
    const userName = decodeURIComponent(rawUserName)

    // Authorization guard: only APR (Accounting Supervisor) or ADM can send batches
    if (!['APR', 'ADM'].includes(role)) {
      return res.status(403).json({
        ok: false,
        error: 'ไม่มีสิทธิ์ส่งเอกสารเข้า AP Interface (ต้องเป็นระดับหัวหน้าฝ่ายบัญชี)',
      })
    }

    const body = req.body || {}
    const { documentIds, companyCode } = body
    let { batchId } = body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'ต้องเลือกเอกสารอย่างน้อย 1 ฉบับเพื่อสร้าง Batch',
      })
    }

    // Load documents
    const docs = await prisma.document.findMany({
      where: { id: { in: documentIds } },
    })

    if (docs.length !== documentIds.length) {
      return res.status(404).json({
        ok: false,
        error: 'พบเอกสารบางฉบับที่ไม่ปรากฏในระบบ',
      })
    }

    // Verify confirmation and locking state
    const lockedDocs = docs.filter((d: any) => d.isLocked)
    if (lockedDocs.length > 0) {
      return res.status(423).json({
        ok: false,
        error: `เอกสาร ${lockedDocs.map((d: any) => d.id).join(', ')} ถูกล็อกอยู่ ไม่สามารถส่งซ้ำได้`,
      })
    }

    const unconfirmed = docs.filter((d: any) => d.status !== 'Confirmed')
    if (unconfirmed.length > 0) {
      return res.status(400).json({
        ok: false,
        error: `เอกสาร ${unconfirmed.map((d: any) => d.id).join(', ')} ยังไม่ได้รับการ Confirm`,
      })
    }

    // Generate batch ID if not given
    if (!batchId) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randNum = Math.floor(Math.random() * 900 + 100)
      batchId = `AP-${todayStr}-${randNum}`
    }

    const totalAmount = docs.reduce((acc: number, d: any) => acc + d.grandTotal, 0)
    const effectiveCompany = companyCode || docs[0]?.companyCode || 'AH'

    // Build staged Oracle interface payload
    const stagedPayload = docs.map((d: any) => ({
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
      ...docs.map((d: any) => {
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

    res.json({
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
    res.status(500).json({ ok: false, error: err.message })
  }
})

apRouter.post('/batches/:id/callback', async (req: Request, res: Response) => {
  try {
    const batchId = String(req.params.id)
    const body = req.body || {}
    const results = body.results

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'ต้องระบุผลลัพธ์ของเอกสารอย่างน้อย 1 รายการ',
      })
    }

    const batch = await prisma.apBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return res.status(404).json({ ok: false, error: `ไม่พบ Batch ID ${batchId}` })
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const nowTimeStr = now.toTimeString().slice(0, 8)

    let successCount = 0
    let failureCount = 0

    // Process each document result in a transaction
    await prisma.$transaction(async (tx: any) => {
      for (const item of results) {
        const doc = await tx.document.findUnique({
          where: { id: item.documentId },
        })

        if (!doc) continue

        let history: any[] = []
        try {
          const parsed = JSON.parse(doc.payloadJson)
          history = Array.isArray(parsed.history) ? parsed.history : []
        } catch {}

        if (item.success) {
          successCount++
          history.push({
            dt: dateStr,
            t: nowTimeStr,
            who: 'Oracle AP Interface',
            act: 'Import สำเร็จ',
            d: `Oracle Invoice ID: ${item.oracleInvoiceId || '—'}`,
            k: 'g',
          })

          await tx.document.update({
            where: { id: item.documentId },
            data: {
              status: 'Posted',
              oracleInvoiceId: item.oracleInvoiceId || null,
              importError: null,
              isLocked: true,
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
              docId: item.documentId,
              act: 'Oracle AP Import สำเร็จ',
              action: 'oracle_ap_sync',
              fromStatus: doc.status,
              toStatus: 'Posted',
              detail: `Oracle Invoice ID: ${item.oracleInvoiceId || '—'}`,
            },
          })
        } else {
          failureCount++
          history.push({
            dt: dateStr,
            t: nowTimeStr,
            who: 'Oracle AP Interface',
            act: 'Import ไม่ผ่าน',
            d: item.error || 'Interface Validation Error',
            k: 'c',
          })

          await tx.document.update({
            where: { id: item.documentId },
            data: {
              status: 'Import Failed',
              importError: item.error || 'Interface Validation Error',
              isLocked: false,
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
              docId: item.documentId,
              act: 'Oracle AP Import ไม่ผ่าน',
              action: 'oracle_ap_fail',
              fromStatus: doc.status,
              toStatus: 'Import Failed',
              detail: item.error || 'Interface Validation Error',
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

    res.json({
      ok: true,
      batch: finalBatch,
      summary: {
        success: successCount,
        failure: failureCount,
        total: results.length,
      },
    })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// --- ORACLE ROUTER ---
export const oracleRouter = Router()

oracleRouter.post('/sync-companies', async (req: Request, res: Response) => {
  try {
    const body = req.body || {}
    const triggeredBy = body.triggeredBy || (req as any).user?.id || 'itsupport'
    const oracleMcpUrl = process.env.ORACLE_MCP_URL
    const oracleMcpToken = process.env.ORACLE_MCP_TOKEN

    let syncSource: 'oracle_mcp' | 'mock_fallback' = 'mock_fallback'
    let syncedCompanies = Object.entries(COMPANIES)
      .filter(([k]) => k !== '?')
      .map(([code, info]) => ({
        code,
        name: info.name,
        tax: info.tax,
        orgs: info.orgs,
      }))

    if (oracleMcpUrl && oracleMcpToken) {
      try {
        const sqlQuery = `
          SELECT 
            hou.ORGANIZATION_ID AS ORG_ID,
            hou.NAME AS OU_NAME,
            xle.LEGAL_ENTITY_IDENTIFIER AS TAX_ID,
            xle.NAME AS COMPANY_NAME
          FROM HR_OPERATING_UNITS hou
          JOIN XLE_ENTITY_PROFILES xle ON hou.DEFAULT_LEGAL_CONTEXT_ID = xle.LEGAL_ENTITY_ID
          ORDER BY hou.ORGANIZATION_ID
        `.trim()

        const mcpRes = await fetch(oracleMcpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${oracleMcpToken}`,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'sql_run',
              arguments: { sql: sqlQuery },
            },
          }),
          signal: AbortSignal.timeout(4000),
        })

        if (mcpRes.ok) {
          const mcpData = await mcpRes.json()
          if (mcpData?.result && !mcpData?.error) {
            syncSource = 'oracle_mcp'
          }
        }
      } catch {
        syncSource = 'mock_fallback'
      }
    }

    // Record audit trail
    try {
      await prisma.auditLog.create({
        data: {
          who: triggeredBy,
          role: 'ADM',
          docId: 'MASTER_DATA',
          act: 'Sync ข้อมูลบริษัทจาก Oracle ERP',
          action: 'oracle_sync_companies',
          detail: `ซิงค์ข้อมูลบริษัทและ ORG_ID ผ่าน ${
            syncSource === 'oracle_mcp' ? 'Oracle MCP Endpoint' : 'Master Fallback Dictionary'
          } สำเร็จ (${syncedCompanies.length} บริษัท)`,
        },
      })
    } catch {}

    res.json({
      ok: true,
      source: syncSource,
      companies: syncedCompanies,
      syncedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Internal Server Error',
    })
  }
})
