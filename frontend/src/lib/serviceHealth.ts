import net from 'net'
import { prisma } from './prisma'

export interface ServiceStatus {
  name: string
  url?: string
  status: 'ok' | 'warn' | 'error'
  message: string
}

// ANSI Color Helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}

/**
 * Quick TCP connection probe with timeout
 */
function probeTcp(host: string, port: number, timeoutMs = 2000): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let resolved = false

    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve({ ok: true })
      }
    })

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve({ ok: false, error: `Connection timed out after ${timeoutMs}ms` })
      }
    })

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true
        socket.destroy()
        resolve({ ok: false, error: err.message })
      }
    })

    socket.connect(port, host)
  })
}

/**
 * 1. Check SQLite / Prisma Database
 */
async function checkDatabase(): Promise<ServiceStatus> {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  try {
    const [docCount, userCount] = await Promise.all([
      prisma.document.count(),
      prisma.user.count(),
    ])
    return {
      name: 'SQLite Database (Prisma)',
      url: dbUrl,
      status: 'ok',
      message: `Connected (${docCount} documents, ${userCount} users loaded)`,
    }
  } catch (err: any) {
    return {
      name: 'SQLite Database (Prisma)',
      url: dbUrl,
      status: 'error',
      message: `Database error: ${err.message}`,
    }
  }
}

/**
 * 2. Check Active Directory / LDAP Service
 */
async function checkLdap(): Promise<ServiceStatus> {
  const rawUrl = process.env.LDAP_URL || 'ldap://10.10.10.250:389'
  try {
    const parsed = new URL(rawUrl)
    const host = parsed.hostname
    const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'ldaps:' ? 636 : 389

    const tcp = await probeTcp(host, port, 2500)
    if (!tcp.ok) {
      return {
        name: 'Active Directory / LDAP',
        url: rawUrl,
        status: 'warn',
        message: `Unreachable (${tcp.error}) -> Offline fallback login mode active`,
      }
    }

    return {
      name: 'Active Directory / LDAP',
      url: rawUrl,
      status: 'ok',
      message: `Connected to domain controller (${host}:${port})`,
    }
  } catch (err: any) {
    return {
      name: 'Active Directory / LDAP',
      url: rawUrl,
      status: 'warn',
      message: `Invalid LDAP URL or connection error: ${err.message}`,
    }
  }
}

/**
 * 3. Check Paperless DMS Service
 */
async function checkPaperless(): Promise<ServiceStatus> {
  const base = (process.env.PAPERLESS_BASE_URL ?? process.env.PAPERLESS_URL ?? 'http://dms.aapico.com').trim().replace(/\/+$/, '')
  const token = (process.env.PAPERLESS_API_TOKEN ?? process.env.PAPERLESS_TOKEN ?? '').trim()

  if (!base) {
    return {
      name: 'Paperless DMS (Document Storage)',
      status: 'warn',
      message: 'Not configured (PAPERLESS_BASE_URL empty) -> Local PDF cache will be used',
    }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Token ${token}`

    const res = await fetch(`${base}/api/`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok || res.status === 401 || res.status === 403 || res.status === 200) {
      return {
        name: 'Paperless DMS (Document Storage)',
        url: base,
        status: 'ok',
        message: `Connected (${res.status} ${res.statusText || 'OK'})`,
      }
    }

    return {
      name: 'Paperless DMS (Document Storage)',
      url: base,
      status: 'warn',
      message: `Server returned HTTP ${res.status} -> Fallback to local cached documents`,
    }
  } catch (err: any) {
    return {
      name: 'Paperless DMS (Document Storage)',
      url: base,
      status: 'warn',
      message: `Unreachable: ${err.message} -> Fallback to local cached documents`,
    }
  }
}

/**
 * 4. Check System A Matching Engine
 */
async function checkSystemAEngine(): Promise<ServiceStatus> {
  const engineUrl = (process.env.SYSTEM_A_URL || 'http://127.0.0.1:8080').trim().replace(/\/+$/, '')

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(`${engineUrl}/health/ready`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (res.ok) {
      return {
        name: 'System A Invoice Matching Engine',
        url: engineUrl,
        status: 'ok',
        message: 'Online & Ready (v6.6 standard)',
      }
    }

    return {
      name: 'System A Invoice Matching Engine',
      url: engineUrl,
      status: 'warn',
      message: `Engine returned HTTP ${res.status} -> Portal running in internal Sandbox mode`,
    }
  } catch {
    return {
      name: 'System A Invoice Matching Engine',
      url: engineUrl,
      status: 'warn',
      message: `Offline -> Portal running in internal Sandbox mode`,
    }
  }
}

/**
 * 5. Check Oracle MCP Gateway / API
 */
async function checkOracleGateway(): Promise<ServiceStatus> {
  const mcpUrl = (process.env.ORACLE_MCP_URL || 'http://ahebs.aapico.com:8080/mcp').trim()

  try {
    const parsed = new URL(mcpUrl)
    const host = parsed.hostname
    const port = parsed.port ? parseInt(parsed.port, 10) : 8080

    const tcp = await probeTcp(host, port, 1500)
    if (tcp.ok) {
      return {
        name: 'Oracle MCP Gateway / ORDS',
        url: mcpUrl,
        status: 'ok',
        message: `Connected (${host}:${port})`,
      }
    }
    return {
      name: 'Oracle MCP Gateway / ORDS',
      url: mcpUrl,
      status: 'warn',
      message: `Gateway unreachable (${tcp.error}) -> Using cached company & receipt mappings`,
    }
  } catch (err: any) {
    return {
      name: 'Oracle MCP Gateway / ORDS',
      url: mcpUrl,
      status: 'warn',
      message: `Check failed: ${err.message}`,
    }
  }
}

/**
 * Execute all integrated service checks in parallel
 */
export async function checkAllServices(): Promise<ServiceStatus[]> {
  const results = await Promise.all([
    checkDatabase(),
    checkLdap(),
    checkPaperless(),
    checkSystemAEngine(),
    checkOracleGateway(),
  ])
  return results
}

/**
 * Format and print service check report to console
 */
export async function printServiceHealthReport(): Promise<void> {
  const divider = '─'.repeat(78)
  console.log(`\n${c.cyan}${c.bold}==============================================================================${c.reset}`)
  console.log(`${c.cyan}${c.bold}  AIVA Portal · Integrated Services Preflight Health Check                    ${c.reset}`)
  console.log(`${c.cyan}${c.bold}==============================================================================${c.reset}`)

  const services = await checkAllServices()

  for (const s of services) {
    let tag = ''
    if (s.status === 'ok') {
      tag = `${c.green}${c.bold}[ OK ]${c.reset}`
    } else if (s.status === 'warn') {
      tag = `${c.yellow}${c.bold}[WARN]${c.reset}`
    } else {
      tag = `${c.red}${c.bold}[FAIL]${c.reset}`
    }

    const namePadded = s.name.padEnd(35, ' ')
    console.log(`  ${tag} ${c.bold}${namePadded}${c.reset} : ${s.message}`)
    if (s.url && s.status !== 'ok') {
      console.log(`         ${c.dim}Endpoint: ${s.url}${c.reset}`)
    }
  }

  console.log(`${c.cyan}──────────────────────────────────────────────────────────────────────────────${c.reset}\n`)
}
