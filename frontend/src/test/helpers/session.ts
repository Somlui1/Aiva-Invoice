/**
 * Test helpers for the v5.5 session model: the API trusts only a signed `aiva_session` cookie.
 *
 *   const cookie = await asUser('u4', 'ACC', { name: 'ปณิดา รักงาน', companies: ['AH'] })
 *   await request(app).post(url).set('Cookie', cookie).send(...)
 *
 * `asUser` writes the user row first (role / companies / receivers are read from the database on
 * every request), then returns a cookie signed with the server's secret.
 */
import { prisma } from '../../lib/prisma'
import { sessionSecret } from '../../server/auth/config'
import { SESSION_COOKIE, signSession } from '../../server/auth/sessionToken'

export type TestRole = 'EU' | 'ACC' | 'APR' | 'ADM' | 'SA'

export function cookieFor(userId: string, ttlSec = 3600): string {
  return `${SESSION_COOKIE}=${signSession(userId, sessionSecret(), ttlSec)}`
}

export async function asUser(
  id: string,
  role: TestRole,
  opts: { name?: string; email?: string; companies?: string[]; receivers?: string[]; isActive?: boolean } = {},
): Promise<string> {
  const email = opts.email ?? `${id}@test.aapico.local`
  const companies = opts.companies ?? ['AH', 'AHA', 'AHT', 'AHP', 'AM']
  const receivers = opts.receivers ?? []
  await prisma.user.upsert({
    where: { id },
    create: { id, email, name: opts.name ?? id, samAccount: id, role, isActive: opts.isActive ?? true },
    update: { name: opts.name ?? id, role, isActive: opts.isActive ?? true },
  })
  await prisma.userCompany.deleteMany({ where: { userId: id } })
  await prisma.userReceiverMap.deleteMany({ where: { userId: id } })
  if (companies.length) await prisma.userCompany.createMany({ data: companies.map(c => ({ userId: id, companyCode: c })) })
  if (receivers.length) {
    await prisma.userReceiverMap.createMany({ data: receivers.map(r => ({ userId: id, receiverName: r, assignedBy: 'TEST' })) })
  }
  return cookieFor(id)
}
