import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma'
import { searchActiveDirectory } from '../../src/lib/adAuth'
import { COMPANIES } from '../../src/mock/companies'
import { requireIntegrationKey, requirePerm } from '../../src/server/auth/guards'
import { isProduction } from '../../src/server/auth/config'
import { RECEIVE_HOLDER_STATUSES } from '../../src/lib/docTransitions'
import { partitionBatch, receiveIdOf } from '../../src/server/receiveIdGuard'
import { callbackOutcome } from '../../src/server/apCallback'
import { docVisibleTo } from '../../src/server/viewAs'
import { publishDocEvent, type DocEvent } from '../../src/server/events'

// --- USERS ROUTER ---
export const usersRouter = Router()

/** Company codes a user may be assigned (the Portal's company master; '?' is "unknown", not assignable). */
const ASSIGNABLE_COMPANIES = (): string[] => Object.keys(COMPANIES).filter(k => k !== '?')

const USER_SAVE_SCHEMA = z.object({
  id: z.string().optional(),
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1),
  samAccount: z.string().trim().optional(),
  empId: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  role: z.enum(['EU', 'ACC', 'APR', 'ADM', 'SA']),
  companies: z.array(z.string()).default([]),
  receivers: z.array(z.string()).default([]),
})

/** Oracle receiver name as stored: trimmed, inner spaces collapsed, case kept (matching ignores case). */
const cleanReceiver = (r: string) => r.normalize('NFKC').replace(/\s+/g, ' ').trim()

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

/**
 * POST /api/users — create or update one user with its companies and Oracle accounts.
 *
 * v5.11.1 production rules:
 *   • only an SA may create an SA, change an SA, or make someone SA (an ADM could promote anyone,
 *     itself included, to SA before)
 *   • nobody changes their own role (no self-promotion, no accidental self lock-out)
 *   • companies must be known codes; ACC / APR need at least one — a user with none sees nothing
 *   • an End User needs at least one Oracle account (Receiver) — that is what scopes their documents
 *   • receivers are trimmed and de-duplicated case-insensitively (a duplicate used to fail the whole
 *     save with a unique-constraint 500)
 *   • saving an inactive user re-activates them; the audit line names the real admin
 */
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
  // Mounted behind requirePerm('MAP'): the admin is the signed-in user, never a header.
  const admin = req.sessionUser!
  const adminId = admin.id
  const adminRole = String(admin.role || '').toUpperCase()

  const known = ASSIGNABLE_COMPANIES()
  const companies = [...new Set(data.companies.map((c: string) => c.trim().toUpperCase()).filter(Boolean))]
  const unknown = companies.filter(c => c !== 'ALL' && !known.includes(c))
  if (unknown.length) return res.status(400).json({ ok: false, error: `ไม่รู้จักรหัสบริษัท: ${unknown.join(', ')}` })
  if (companies.includes('ALL') && adminRole !== 'SA') {
    return res.status(403).json({ ok: false, error: 'สิทธิ์ทุกบริษัท (ALL) กำหนดได้เฉพาะ Super Admin' })
  }
  const seen = new Set<string>()
  const receivers: string[] = []
  for (const r of data.receivers.map(cleanReceiver).filter(Boolean)) {
    const k = r.toUpperCase()
    if (!seen.has(k)) {
      seen.add(k)
      receivers.push(r)
    }
  }
  if (data.role === 'EU' && receivers.length === 0) {
    return res.status(400).json({ ok: false, error: 'End User ต้องผูก Oracle account (Receiver) อย่างน้อย 1 บัญชี' })
  }
  if ((data.role === 'ACC' || data.role === 'APR') && companies.length === 0) {
    return res.status(400).json({ ok: false, error: 'ฝ่ายบัญชีต้องได้รับมอบหมายบริษัทอย่างน้อย 1 บริษัท' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing && existing.id === adminId && existing.role !== data.role) {
      return res.status(403).json({ ok: false, error: 'เปลี่ยนบทบาทของตัวเองไม่ได้ · ให้ผู้ดูแลระบบคนอื่นทำ' })
    }
    if (adminRole !== 'SA' && (data.role === 'SA' || existing?.role === 'SA')) {
      return res.status(403).json({ ok: false, error: 'จัดการผู้ใช้ระดับ Super Admin ได้เฉพาะ Super Admin' })
    }

    const user = await prisma.$transaction(async (tx: any) => {
      // 1. Upsert User
      const u = await tx.user.upsert({
        where: { email: data.email },
        create: {
          id: data.id || `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          email: data.email,
          name: data.name,
          samAccount: data.samAccount || data.email.split('@')[0],
          empId: data.empId,
          unit: data.unit,
          role: data.role,
          isActive: true,
        },
        update: {
          name: data.name,
          samAccount: data.samAccount || data.email.split('@')[0],
          empId: data.empId,
          unit: data.unit,
          role: data.role,
          isActive: true,
        },
      })

      // 2. Synchronize Companies
      await tx.userCompany.deleteMany({ where: { userId: u.id } })
      if (companies.length > 0) {
        await tx.userCompany.createMany({
          data: companies.map(c => ({ userId: u.id, companyCode: c })),
        })
      }

      // 3. Synchronize Receivers (Oracle accounts) — only End Users are scoped by them
      await tx.userReceiverMap.deleteMany({ where: { userId: u.id } })
      const rcv = data.role === 'EU' ? receivers : []
      if (rcv.length > 0) {
        await tx.userReceiverMap.createMany({
          data: rcv.map(r => ({
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
          who: admin.name || adminId,
          role: adminRole,
          act: existing ? 'แก้ไขสิทธิ์ผู้ใช้' : 'เพิ่มผู้ใช้',
          action: 'SAVE_USER',
          detail: `บันทึกผู้ใช้ ${u.name} (${u.email}) · Role: ${existing && existing.role !== u.role ? `${existing.role} → ` : ''}${u.role} · บริษัท: ${
            companies.join(', ') || '—'
          } · Oracle account: ${rcv.join(', ') || '—'}${existing && !existing.isActive ? ' · เปิดใช้งานอีกครั้ง' : ''}`,
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
        companies,
        receivers: data.role === 'EU' ? receivers : [],
        isActive: true,
      },
    })
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to save user',
    })
  }
})

/**
 * DELETE /api/users/:id — deactivate (soft). The row, its history and its audit trail stay; the user
 * is signed out on the next request (session middleware re-reads isActive). Before v5.11.1 the RBAC
 * page showed "deleted" but never told the server, so the user kept every right.
 */
usersRouter.delete('/:id', async (req: Request, res: Response) => {
  const admin = req.sessionUser!
  const adminRole = String(admin.role || '').toUpperCase()
  const id = String(req.params.id || '')
  try {
    const u = await prisma.user.findUnique({ where: { id } })
    if (!u) return res.status(404).json({ ok: false, error: `ไม่พบผู้ใช้ ${id}` })
    if (u.id === admin.id) return res.status(403).json({ ok: false, error: 'ปิดบัญชีของตัวเองไม่ได้' })
    if (u.role === 'SA' && adminRole !== 'SA') {
      return res.status(403).json({ ok: false, error: 'ปิดบัญชี Super Admin ได้เฉพาะ Super Admin' })
    }
    if (!u.isActive) return res.json({ ok: true, user: { id: u.id, isActive: false } })
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { isActive: false } }),
      prisma.auditLog.create({
        data: {
          docId: 'USER_MANAGEMENT',
          whoId: admin.id,
          who: admin.name || admin.id,
          role: adminRole,
          act: 'ปิดการใช้งานผู้ใช้',
          action: 'DEACTIVATE_USER',
          detail: `ปิดการใช้งาน ${u.name} (${u.email}) · Role: ${u.role}`,
        },
      }),
    ])
    res.json({ ok: true, user: { id, isActive: false } })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || 'Failed to deactivate user' })
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

  // The sample directory below is demo data: production answers from AD only.
  if (isProduction()) {
    if (q.length < 2) return res.json({ ok: true, results: [], source: 'ad' })
    try {
      return res.json({ ok: true, results: await searchActiveDirectory(q), source: 'ad' })
    } catch (err: any) {
      return res.status(502).json({ ok: false, error: `ค้นหา Active Directory ไม่สำเร็จ: ${err?.message || err}` })
    }
  }

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

    // Scope comes from the signed-in user, not from the query string. Before v5.5 any caller could
    // send ?role=SA and read every log. (The page still sends these parameters; they are ignored.)
    const session = req.sessionUser!
    const whoId = session.id
    const role = session.role
    const companies = session.companies || []

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

/** Rows of an MCP `sql_run` answer, whichever common shape it comes in; [] when none. */
function mcpRows(data: any): Record<string, unknown>[] {
  const r = data?.result
  const pick = (v: any): Record<string, unknown>[] | null => (Array.isArray(v) && v.every(x => x && typeof x === 'object') ? v : null)
  const direct = pick(r?.rows) ?? pick(r?.data) ?? pick(r)
  if (direct) return direct
  for (const c of Array.isArray(r?.content) ? r.content : []) {
    if (c?.type !== 'text' || typeof c.text !== 'string') continue
    try {
      const parsed = JSON.parse(c.text)
      const rows = pick(parsed) ?? pick(parsed?.rows) ?? pick(parsed?.data)
      if (rows) return rows
    } catch {}
  }
  return []
}

// --- AP ROUTER ---
export const apRouter = Router()

apRouter.get('/batches', requirePerm('VIEW_AP'), async (_req: Request, res: Response) => {
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
    // Who sends the batch = the signed-in user. Before v5.5 the role came from the x-user-role header.
    const session = req.sessionUser
    if (!session) return res.status(401).json({ ok: false, error: 'กรุณาเข้าสู่ระบบ', code: 'UNAUTHENTICATED' })
    const role = session.role
    const userId = session.id
    const userName = session.name

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

    const now = new Date()
    const nowTimeStr = now.toTimeString().slice(0, 8)
    const dateStr = now.toISOString().slice(0, 10)
    const withHistory = (d: any, entry: Record<string, unknown>, status: string, extra: Record<string, unknown> = {}) => {
      let parsed: Record<string, any> = {}
      try {
        parsed = JSON.parse(d.payloadJson || '{}') || {}
      } catch {}
      const history = Array.isArray(parsed.history) ? [...parsed.history] : []
      history.push({ dt: dateStr, t: nowTimeStr, ...entry })
      return JSON.stringify({ ...parsed, ...extra, status, history })
    }

    // v5.11: one transaction — re-check, apply the receive_id guard, then write. A selected document
    // whose receive_id is already held (another document Confirmed earlier / Sent / Posted / Import
    // Failed, or a second one in this batch) is taken out as Duplicate; the rest is sent.
    const outcome = await prisma.$transaction(async (tx: any) => {
      const fresh = await tx.document.findMany({ where: { id: { in: documentIds } } })
      // v5.11.1: an approver sends only documents of the companies assigned to them.
      // (ADM keeps the pre-v5.11.1 right to send: that role has no document scope at all.)
      const outOfScope =
        role === 'ADM' ? [] : fresh.filter((d: any) => !docVisibleTo({ company: d.companyCode, receiver: d.receiverName }, session).ok)
      if (outOfScope.length) {
        throw Object.assign(new Error(`ไม่มีสิทธิ์ในเอกสาร ${outOfScope.map((d: any) => `${d.id} (${d.companyCode})`).join(', ')}`), { http: 403 })
      }
      const notReady = fresh.filter((d: any) => d.status !== 'Confirmed' || d.isLocked)
      if (fresh.length !== documentIds.length || notReady.length) {
        throw Object.assign(new Error(`เอกสาร ${notReady.map((d: any) => d.id).join(', ') || 'บางฉบับ'} เปลี่ยนสถานะระหว่างนี้ · โหลดใหม่`), { http: 409 })
      }
      const rids = [...new Set(fresh.map((d: any) => receiveIdOf(d)).filter(Boolean))] as string[]
      const outside = rids.length
        ? await tx.document.findMany({
            where: {
              id: { notIn: documentIds },
              status: { in: [...RECEIVE_HOLDER_STATUSES] },
              OR: rids.flatMap(r => [{ receiveId: r }, { receiptNum: r }]),
            },
            select: { id: true, status: true, receiveId: true, receiptNum: true, confirmedAt: true, isLocked: true },
          })
        : []
      const part = partitionBatch(fresh, outside)

      for (const dup of part.duplicates) {
        const d = fresh.find((x: any) => x.id === dup.id)
        const why = `ใบรับ ${dup.receiveId} ถูกใช้โดย ${dup.duplicateOf} แล้ว → ตัดออกจาก Batch เป็น Duplicate`
        await tx.document.update({
          where: { id: dup.id },
          data: {
            status: 'Duplicate',
            duplicateOfId: dup.duplicateOf,
            drRule: 'AP-GUARD',
            drMatchedBy: 'RECEIVE_ID',
            payloadJson: withHistory(d, { who: 'ระบบ Portal (AP guard)', act: 'Duplicate (ตัดออกจาก Batch)', d: why, k: 'c' }, 'Duplicate', {
              duplicateOf: dup.duplicateOf,
              dupRule: 'AP-GUARD',
            }),
          },
        })
        await tx.auditLog.create({
          data: { who: userName, role, docId: dup.id, act: 'ตัดออกจาก Batch (receive_id ซ้ำ)', action: 'ap_guard_duplicate', fromStatus: 'Confirmed', toStatus: 'Duplicate', detail: why },
        })
      }

      const sendDocs = fresh.filter((d: any) => part.send.includes(d.id))
      if (sendDocs.length === 0) return { batch: null, sendDocs, stagedPayload: [], duplicates: part.duplicates }

      const totalAmount = sendDocs.reduce((acc: number, d: any) => acc + d.grandTotal, 0)
      const effectiveCompany = companyCode || sendDocs[0]?.companyCode || 'AH'
      const stagedPayload = sendDocs.map((d: any) => ({
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
        STAGED_AT: now.toISOString(),
      }))

      const batch = await tx.apBatch.create({
        data: {
          id: batchId,
          status: 'SENT',
          totalDocs: sendDocs.length,
          totalAmount,
          companyCode: effectiveCompany,
          createdBy: userId,
          sentAt: now,
          payloadJson: JSON.stringify(stagedPayload),
        },
      })
      for (const d of sendDocs) {
        const w = await tx.document.updateMany({
          where: { id: d.id, status: 'Confirmed', isLocked: false },
          data: {
            status: 'Sent',
            isLocked: true,
            lockedAt: now,
            lockedBy: userId,
            apBatchId: batchId,
            // Before v5.11 the payload kept "Confirmed" and the history entry was built but never saved.
            payloadJson: withHistory(d, { who: userName, act: `ส่งเข้า AP Interface (${batchId})`, d: `ส่งโดย ${userName} (หัวหน้าฝ่ายบัญชี)`, k: 'g' }, 'Sent', {
              apBatchId: batchId,
            }),
          },
        })
        if (w.count !== 1) throw Object.assign(new Error(`เอกสาร ${d.id} เปลี่ยนสถานะระหว่างนี้ · โหลดใหม่`), { http: 409 })
        await tx.auditLog.create({
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
      }
      return { batch, sendDocs, stagedPayload, duplicates: part.duplicates }
    })

    for (const d of outcome.sendDocs as any[]) {
      publishDocEvent({ kind: 'sent', docId: d.id, status: 'Sent', company: d.companyCode, receiver: d.receiverName ?? null, title: 'ส่งเข้า AP Interface', detail: `Batch ${batchId} · โดย ${userName}`, actorId: userId })
    }
    for (const x of outcome.duplicates) {
      const d = (outcome.sendDocs as any[]).find(s => s.id === x.duplicateOf)
      publishDocEvent({ kind: 'status', docId: x.id, status: 'Duplicate', company: d?.companyCode ?? '', receiver: null, title: 'ตัดออกจาก Batch (ใบรับซ้ำ)', detail: `ซ้ำกับ ${x.duplicateOf}`, actorId: userId })
    }

    res.json({
      ok: true,
      batch: outcome.batch
        ? {
            id: outcome.batch.id,
            status: outcome.batch.status,
            totalDocs: outcome.batch.totalDocs,
            totalAmount: outcome.batch.totalAmount,
            sentAt: outcome.batch.sentAt,
          }
        : null,
      documentIds: outcome.sendDocs.map((d: any) => d.id),
      /** Taken out as Duplicate by the receive_id guard (normally empty). */
      excluded: outcome.duplicates,
      stagedPayload: outcome.stagedPayload,
    })
  } catch (err: any) {
    if (err?.http) return res.status(err.http).json({ ok: false, error: err.message })
    if (err?.code === 'P2034' || /database is locked|SQLITE_BUSY|write conflict/i.test(String(err?.message ?? ''))) {
      return res.status(409).json({ ok: false, error: 'มีการแก้ไขเอกสารพร้อมกัน · โหลดใหม่แล้วลองอีกครั้ง' })
    }
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Called by the Oracle AP interface, not by a person: shared key (Authorization: Bearer / X-AIVA-Key).
//
// v5.11 contract — each item of `results`:
//   { documentId, result: 'SUCCESS' | 'ALREADY_EXISTS' | 'ERROR', oracleInvoiceId?, errorCode?, error? }
//   SUCCESS         → Posted
//   ALREADY_EXISTS  → Posted (the invoice is already in Oracle AP — e.g. keyed in Oracle directly).
//                     Oracle's answer is authoritative; the Portal does not re-compare amounts/keys.
//                     NOTE for the Oracle API: answer ALREADY_EXISTS only for THIS invoice (same
//                     receive_id or supplier tax id + invoice number), or a document that never
//                     reached AP would be closed as Posted.
//   ERROR           → Import Failed (API / validation error; errorCode e.g. "404" is kept)
//   Without `result`, the pre-v5.11 `success: boolean` is read (true = SUCCESS, false = ERROR).
//
// Only a document that is Sent in THIS batch is updated. A repeated or late callback (document
// already Posted, back in Review, or in another batch) is skipped and audited, so it can never
// downgrade a Posted document.
apRouter.post('/batches/:id/callback', requireIntegrationKey('oracle'), async (req: Request, res: Response) => {
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
    let alreadyCount = 0
    let failureCount = 0
    const pendingEvents: DocEvent[] = []
    const skipped: { documentId: string; why: string }[] = []

    await prisma.$transaction(async (tx: any) => {
      for (const item of results) {
        const documentId = String(item?.documentId ?? '')
        const outcome = callbackOutcome(item)
        const doc = documentId ? await tx.document.findUnique({ where: { id: documentId } }) : null

        if (!doc || doc.status !== 'Sent' || doc.apBatchId !== batchId || !outcome) {
          const why = !doc
            ? 'ไม่พบเอกสาร'
            : !outcome
              ? 'ผลลัพธ์ไม่ถูกต้อง (ต้องเป็น SUCCESS / ALREADY_EXISTS / ERROR)'
              : doc.apBatchId !== batchId
                ? `เอกสารอยู่ใน Batch ${doc.apBatchId ?? '—'}`
                : `สถานะปัจจุบัน ${doc.status} (ไม่ใช่ Sent) · ผลซ้ำหรือมาช้า`
          skipped.push({ documentId, why })
          await tx.auditLog.create({
            data: {
              who: 'Oracle AP Interface',
              role: 'SYSTEM',
              docId: documentId || '—',
              act: 'ข้ามผล Oracle AP',
              action: 'oracle_ap_skip',
              fromStatus: doc?.status ?? null,
              toStatus: doc?.status ?? null,
              detail: `Batch ${batchId} · ${outcome ?? 'INVALID'} · ${why}`,
            },
          })
          continue
        }

        let payload: Record<string, any> = {}
        try {
          payload = JSON.parse(doc.payloadJson || '{}') || {}
        } catch {}
        const history = Array.isArray(payload.history) ? [...payload.history] : []
        const oracleInvoiceId = item.oracleInvoiceId ? String(item.oracleInvoiceId) : null

        if (outcome === 'SUCCESS' || outcome === 'ALREADY_EXISTS') {
          const already = outcome === 'ALREADY_EXISTS'
          if (already) alreadyCount++
          else successCount++
          pendingEvents.push({ kind: 'posted', docId: documentId, status: 'Posted', company: doc.companyCode, receiver: doc.receiverName ?? null, title: already ? 'พบว่าถูก Post ใน Oracle แล้ว' : 'Oracle รับแล้ว (Posted)', detail: `Batch ${batchId}` })
          const act = already ? 'พบว่าถูก Post ใน Oracle แล้ว' : 'Import สำเร็จ'
          const detail = `${already ? 'Oracle ตอบว่ามีใบแจ้งหนี้นี้อยู่แล้ว (Post จากช่องทางอื่น) · ' : ''}Oracle Invoice ID: ${oracleInvoiceId || '—'}`
          history.push({ dt: dateStr, t: nowTimeStr, who: 'Oracle AP Interface', act, d: detail, k: 'g' })

          await tx.document.update({
            where: { id: documentId },
            data: {
              status: 'Posted',
              oracleInvoiceId,
              importError: null,
              isLocked: true,
              payloadJson: JSON.stringify({ ...payload, status: 'Posted', history }),
            },
          })
          await tx.auditLog.create({
            data: {
              who: 'Oracle AP Interface',
              role: 'SYSTEM',
              docId: documentId,
              act: already ? 'Oracle AP: มีอยู่แล้ว → Posted' : 'Oracle AP Import สำเร็จ',
              action: already ? 'oracle_ap_already_exists' : 'oracle_ap_sync',
              fromStatus: doc.status,
              toStatus: 'Posted',
              detail,
            },
          })
        } else {
          failureCount++
          const code = item.errorCode != null ? String(item.errorCode) : null
          const msg = `${code ? `[${code}] ` : ''}${item.error || 'Interface Validation Error'}`
          pendingEvents.push({ kind: 'failed', docId: documentId, status: 'Import Failed', company: doc.companyCode, receiver: doc.receiverName ?? null, title: 'Import ไม่สำเร็จ', detail: `${msg} · Batch ${batchId}` })
          history.push({ dt: dateStr, t: nowTimeStr, who: 'Oracle AP Interface', act: 'Import ไม่ผ่าน', d: msg, k: 'c' })

          await tx.document.update({
            where: { id: documentId },
            data: {
              status: 'Import Failed',
              importError: msg,
              isLocked: false,
              payloadJson: JSON.stringify({ ...payload, status: 'Import Failed', history }),
            },
          })
          await tx.auditLog.create({
            data: {
              who: 'Oracle AP Interface',
              role: 'SYSTEM',
              docId: documentId,
              act: 'Oracle AP Import ไม่ผ่าน',
              action: 'oracle_ap_fail',
              fromStatus: doc.status,
              toStatus: 'Import Failed',
              detail: msg,
            },
          })
        }
      }

      // Batch status from the documents actually processed; ALREADY_EXISTS counts as success.
      const ok = successCount + alreadyCount
      if (ok + failureCount > 0) {
        await tx.apBatch.update({
          where: { id: batchId },
          data: { status: failureCount === 0 ? 'SYNCED' : ok === 0 ? 'FAILED' : 'PARTIAL' },
        })
      }
    })

    // published only after the transaction committed
    for (const e of pendingEvents) publishDocEvent(e)

    const finalBatch = await prisma.apBatch.findUnique({
      where: { id: batchId },
    })

    res.json({
      ok: true,
      batch: finalBatch,
      summary: {
        success: successCount,
        alreadyExists: alreadyCount,
        failure: failureCount,
        skipped: skipped.length,
        total: results.length,
      },
      skipped,
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
    const triggeredBy = req.sessionUser?.id || 'system'
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
          // v5.11.1: "synced" only when Oracle's rows were actually read and applied. Before, any
          // non-error answer was reported as an Oracle sync while the master list was returned as-is.
          const rows = mcpRows(mcpData)
          if (!mcpData?.error && rows.length) {
            const byTax = new Map<string, { orgs: Set<number>; name?: string }>()
            for (const r of rows) {
              const tax = String(r.TAX_ID ?? r.tax_id ?? '').replace(/\D/g, '')
              const org = Number(r.ORG_ID ?? r.org_id)
              if (!tax || !Number.isFinite(org)) continue
              const e = byTax.get(tax) ?? { orgs: new Set<number>(), name: String(r.COMPANY_NAME ?? r.company_name ?? '') || undefined }
              e.orgs.add(org)
              byTax.set(tax, e)
            }
            let matched = 0
            syncedCompanies = syncedCompanies.map(c => {
              const hit = byTax.get(String(c.tax).replace(/\D/g, ''))
              if (!hit) return c
              matched++
              return { ...c, orgs: [...hit.orgs].sort((a, b) => a - b) }
            })
            if (matched > 0) syncSource = 'oracle_mcp'
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
          who: req.sessionUser?.name || triggeredBy,
          whoId: req.sessionUser?.id,
          role: String(req.sessionUser?.role || 'ADM'),
          docId: 'MASTER_DATA',
          act: 'Sync ข้อมูลบริษัทจาก Oracle ERP',
          action: 'oracle_sync_companies',
          detail:
            syncSource === 'oracle_mcp'
              ? `ซิงค์ ORG_ID จาก Oracle สำเร็จ (${syncedCompanies.length} บริษัท)`
              : `ไม่ได้ซิงค์จาก Oracle · ใช้ข้อมูลบริษัทในระบบ (${syncedCompanies.length} บริษัท)`,
        },
      })
    } catch {}

    res.json({
      ok: true,
      source: syncSource,
      companies: syncedCompanies,
      syncedAt: new Date().toISOString(),
      ...(syncSource === 'mock_fallback'
        ? { warning: oracleMcpUrl && oracleMcpToken ? 'อ่านข้อมูลจาก Oracle ไม่ได้ · แสดงข้อมูลบริษัทในระบบ (ไม่ได้ซิงค์)' : 'ยังไม่ได้ตั้งค่า ORACLE_MCP_URL / ORACLE_MCP_TOKEN · แสดงข้อมูลบริษัทในระบบ (ไม่ได้ซิงค์)' }
        : {}),
    })
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Internal Server Error',
    })
  }
})
