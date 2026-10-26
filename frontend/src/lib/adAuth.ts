import fs from 'node:fs'
import { Client } from 'ldapts'

export interface AdUserData {
  samAccount: string
  name: string
  email: string
  empId?: string
  unit?: string
  title?: string
}

/**
 * Active Directory settings — read at call time, no defaults in code.
 *
 *  LDAP_URL            ldaps://dc.aapico.com:636   (production must be ldaps://)
 *  LDAP_BIND_DN        read-only service account   (NOT itsupport)
 *  LDAP_BIND_PASSWORD
 *  LDAP_SEARCH_BASE    DC=aapico,DC=com
 *  LDAP_UPN_SUFFIX     aapico.com                  (user "somsak.j" binds as somsak.j@aapico.com)
 *  LDAP_CA_FILE        /run/secrets/aapico-root-ca.pem  (the company CA that signed the DC certificate)
 *  LDAP_TLS_INSECURE   true = do not verify the DC certificate (dev / staging only; refused in production)
 */
export function ldapSettings(env: Record<string, string | undefined> = process.env) {
  const t = (v?: string) => (v ?? '').trim()
  return {
    url: t(env.LDAP_URL),
    bindDn: t(env.LDAP_BIND_DN),
    bindPassword: t(env.LDAP_BIND_PASSWORD),
    searchBase: t(env.LDAP_SEARCH_BASE),
    upnSuffix: t(env.LDAP_UPN_SUFFIX) || 'aapico.com',
    caFile: t(env.LDAP_CA_FILE),
    insecure: /^(1|true|yes)$/i.test(t(env.LDAP_TLS_INSECURE)) && t(env.NODE_ENV) !== 'production',
  }
}

/** RFC 4515 escaping for values placed inside an LDAP filter (prevents filter injection). */
export function escapeLdapFilter(value: string): string {
  return value.replace(/[\\*()\u0000]/g, c => '\\' + c.charCodeAt(0).toString(16).padStart(2, '0'))
}

/** A sAMAccountName as AD allows it (no filter metacharacters, no spaces). */
export const SAM_PATTERN = /^[a-z0-9._-]{1,64}$/i

function createLdapClient() {
  const s = ldapSettings()
  if (!s.url) throw Object.assign(new Error('LDAP_URL is not configured'), { code: 'LDAP_NOT_CONFIGURED' })
  const tlsOptions = s.url.startsWith('ldaps://')
    ? {
        ...(s.caFile ? { ca: [fs.readFileSync(s.caFile)] } : {}),
        rejectUnauthorized: !s.insecure,
        minVersion: 'TLSv1.2' as const,
      }
    : undefined
  return new Client({ url: s.url, timeout: 5000, connectTimeout: 5000, strictDN: false, tlsOptions })
}

/**
 * Verify user credentials against Active Directory (bind as the user), then read their profile.
 */
export async function authenticateWithAd(
  username: string,
  password: string,
): Promise<{ ok: true; user: AdUserData } | { ok: false; kind: 'cred' | 'timeout'; error: string }> {
  const cleanUser = username.trim()
  // An empty password is an "unauthenticated bind" that AD accepts — never let it through.
  if (!cleanUser || !password) {
    return { ok: false, kind: 'cred', error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }
  }
  const samAccount = (cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser).toLowerCase()
  if (!SAM_PATTERN.test(samAccount)) {
    return { ok: false, kind: 'cred', error: 'ชื่อผู้ใช้หรือรหัสผ่าน Active Directory ไม่ถูกต้อง' }
  }

  let client: Client
  try {
    client = createLdapClient()
  } catch (err: any) {
    return { ok: false, kind: 'timeout', error: `ไม่สามารถเชื่อมต่อ Active Directory: ${err.message}` }
  }
  const s = ldapSettings()
  const upn = cleanUser.includes('@') ? cleanUser : `${cleanUser}@${s.upnSuffix}`

  try {
    await client.bind(upn, password)

    const searchRes = await client.search(s.searchBase, {
      filter: `(&(objectCategory=person)(objectClass=user)(sAMAccountName=${escapeLdapFilter(samAccount)}))`,
      scope: 'sub',
      sizeLimit: 1,
      attributes: ['sAMAccountName', 'displayName', 'mail', 'employeeID', 'department', 'title', 'userAccountControl'],
    })

    const entry = searchRes.searchEntries[0] as any
    // userAccountControl bit 2 = ACCOUNTDISABLE
    if (entry && Number(entry.userAccountControl) & 2) {
      return { ok: false, kind: 'cred', error: 'บัญชี Active Directory ถูกปิดใช้งาน' }
    }
    return {
      ok: true,
      user: {
        samAccount: entry?.sAMAccountName ? String(entry.sAMAccountName) : samAccount,
        name: entry?.displayName ? String(entry.displayName) : cleanUser,
        email: entry?.mail ? String(entry.mail).toLowerCase() : upn.toLowerCase(),
        empId: entry?.employeeID ? String(entry.employeeID) : undefined,
        unit: entry?.department ? String(entry.department) : undefined,
        title: entry?.title ? String(entry.title) : undefined,
      },
    }
  } catch (err: any) {
    const msg = err?.message || ''
    // Invalid credentials from AD (resultCode 49 / data 52e, 775 = locked, 533 = disabled)
    const isCred =
      err?.code === 49 ||
      err?.name === 'InvalidCredentialsError' ||
      /InvalidCredentials|data (52e|775|533)\b|invalid credentials/i.test(msg)
    if (isCred) {
      return { ok: false, kind: 'cred', error: 'ชื่อผู้ใช้หรือรหัสผ่าน Active Directory ไม่ถูกต้อง' }
    }
    return { ok: false, kind: 'timeout', error: `ไม่สามารถเชื่อมต่อ Active Directory: ${msg}` }
  } finally {
    await client.unbind().catch(() => {})
  }
}

/**
 * Search Active Directory with the read-only service account (permission screen: "add user").
 * Returns [] when AD is not configured or unreachable; the caller decides what to show.
 */
export async function searchActiveDirectory(query: string): Promise<AdUserData[]> {
  const cleanQ = query.trim().slice(0, 64)
  if (cleanQ.length < 2) return []
  const s = ldapSettings()
  if (!s.url || !s.bindDn || !s.bindPassword || !s.searchBase) return []

  const client = createLdapClient()
  const q = escapeLdapFilter(cleanQ)
  try {
    await client.bind(s.bindDn, s.bindPassword)
    const searchRes = await client.search(s.searchBase, {
      filter: `(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=*${q}*)(displayName=*${q}*)(mail=*${q}*)(employeeID=*${q}*)))`,
      scope: 'sub',
      sizeLimit: 15,
      attributes: ['sAMAccountName', 'displayName', 'mail', 'employeeID', 'department', 'title'],
    })

    return searchRes.searchEntries.map((e: any) => ({
      samAccount: String(e.sAMAccountName || ''),
      name: String(e.displayName || e.sAMAccountName || ''),
      email: String(e.mail || `${e.sAMAccountName}@${s.upnSuffix}`).toLowerCase(),
      empId: e.employeeID ? String(e.employeeID) : undefined,
      unit: e.department ? String(e.department) : undefined,
      title: e.title ? String(e.title) : undefined,
    }))
  } catch (err) {
    console.warn('[adAuth] AD search error:', (err as Error)?.message)
    return []
  } finally {
    await client.unbind().catch(() => {})
  }
}
