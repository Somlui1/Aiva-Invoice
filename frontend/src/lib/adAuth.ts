import { Client } from 'ldapts'

export interface AdUserData {
  samAccount: string
  name: string
  email: string
  empId?: string
  unit?: string
  title?: string
}

const LDAP_URL = process.env.LDAP_URL || 'ldap://10.10.10.250:389'
const LDAP_BIND_DN = process.env.LDAP_BIND_DN || 'itsupport@aapico.com'
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD || 'support'
const LDAP_SEARCH_BASE = process.env.LDAP_SEARCH_BASE || 'DC=aapico,DC=com'

function createLdapClient() {
  return new Client({
    url: LDAP_URL,
    timeout: 5000,
    connectTimeout: 5000,
    strictDN: false,
  })
}

/**
 * Verify user credentials directly against real Active Directory domain controller
 */
export async function authenticateWithAd(
  username: string,
  password: string
): Promise<{ ok: true; user: AdUserData } | { ok: false; kind: 'cred' | 'timeout'; error: string }> {
  const cleanUser = username.trim()
  if (!cleanUser || !password) {
    return { ok: false, kind: 'cred', error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }
  }

  const upn = cleanUser.includes('@') ? cleanUser : `${cleanUser}@aapico.com`
  const client = createLdapClient()

  try {
    // 1. Authenticate user via LDAP bind
    await client.bind(upn, password)

    // 2. Query user details
    const samAccount = cleanUser.includes('@') ? cleanUser.split('@')[0] : cleanUser
    const searchRes = await client.search(LDAP_SEARCH_BASE, {
      filter: `(sAMAccountName=${samAccount})`,
      scope: 'sub',
      sizeLimit: 1,
      attributes: ['sAMAccountName', 'displayName', 'mail', 'employeeID', 'department', 'title'],
    })

    const entry = searchRes.searchEntries[0] as any
    const name = entry?.displayName ? String(entry.displayName) : cleanUser
    const email = entry?.mail ? String(entry.mail) : upn
    const empId = entry?.employeeID ? String(entry.employeeID) : undefined
    const unit = entry?.department ? String(entry.department) : undefined
    const title = entry?.title ? String(entry.title) : undefined

    return {
      ok: true,
      user: {
        samAccount,
        name,
        email,
        empId,
        unit,
        title,
      },
    }
  } catch (err: any) {
    const msg = err.message || ''
    // Invalid credentials error codes from AD (e.g. data 52e, code 49)
    if (msg.includes('49') || msg.includes('InvalidCredentialsError') || msg.includes('52e') || msg.includes('credentials')) {
      return { ok: false, kind: 'cred', error: 'ชื่อผู้ใช้หรือรหัสผ่าน Active Directory ไม่ถูกต้อง' }
    }
    return { ok: false, kind: 'timeout', error: `ไม่สามารถเชื่อมต่อ Active Directory: ${msg}` }
  } finally {
    await client.unbind().catch(() => {})
  }
}

/**
 * Search Active Directory using the service account bind credentials (itsupport / support)
 */
export async function searchActiveDirectory(query: string): Promise<AdUserData[]> {
  const cleanQ = query.trim()
  if (!cleanQ) return []

  const client = createLdapClient()

  try {
    await client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD)
    const searchRes = await client.search(LDAP_SEARCH_BASE, {
      filter: `(|(sAMAccountName=*${cleanQ}*)(displayName=*${cleanQ}*)(mail=*${cleanQ}*)(employeeID=*${cleanQ}*))`,
      scope: 'sub',
      sizeLimit: 15,
      attributes: ['sAMAccountName', 'displayName', 'mail', 'employeeID', 'department', 'title'],
    })

    return searchRes.searchEntries.map((e: any) => ({
      samAccount: String(e.sAMAccountName || ''),
      name: String(e.displayName || e.sAMAccountName || ''),
      email: String(e.mail || `${e.sAMAccountName}@aapico.com`),
      empId: e.employeeID ? String(e.employeeID) : undefined,
      unit: e.department ? String(e.department) : undefined,
      title: e.title ? String(e.title) : undefined,
    }))
  } catch (err) {
    console.warn('Real AD search error:', err)
    return []
  } finally {
    await client.unbind().catch(() => {})
  }
}
