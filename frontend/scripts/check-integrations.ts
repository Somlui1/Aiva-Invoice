/**
 * Real connectivity checks for staging / pre-production (does not start the server, writes nothing).
 *
 *   npx tsx scripts/check-integrations.ts --ad-user somsak.j --dms 1234
 *   CHECK_AD_PASSWORD='…' npx tsx scripts/check-integrations.ts --ad-user somsak.j   # also a user bind
 *
 * AD        service-account bind over the configured URL (TLS + certificate verified when ldaps://),
 *           search for --ad-user, report disabled accounts; with CHECK_AD_PASSWORD also bind as that user
 *           (the password comes from the environment only — never from argv / shell history).
 * Paperless token accepted, user permissions read from /api/ui_settings/ (warns if the token can
 *           change or delete), download of --dms <paperless id> starts with %PDF.
 * Config    productionConfigProblems() for NODE_ENV=production.
 *
 * Exit code 0 = every check passed, 1 = something failed. Secrets are never printed.
 */
import { Client } from 'ldapts'
import fs from 'node:fs'
import { escapeLdapFilter, ldapSettings, authenticateWithAd } from '../src/lib/adAuth'
import { productionConfigProblems } from '../src/server/auth/config'

type Row = { area: string; check: string; ok: boolean | null; detail: string }
const rows: Row[] = []
const add = (area: string, check: string, ok: boolean | null, detail = '') => rows.push({ area, check, ok, detail })
const arg = (n: string) => {
  const i = process.argv.indexOf(n)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function checkAd() {
  const s = ldapSettings()
  if (!s.url) return add('AD', 'LDAP_URL set', false, 'not configured')
  add('AD', 'encrypted (ldaps://)', s.url.startsWith('ldaps://'), s.url.replace(/\/\/[^@]*@/, '//'))
  if (s.url.startsWith('ldaps://')) add('AD', 'certificate verified', !s.insecure, s.caFile ? `CA ${s.caFile}` : 'system CA store')
  const client = new Client({
    url: s.url,
    timeout: 5000,
    connectTimeout: 5000,
    tlsOptions: s.url.startsWith('ldaps://')
      ? { ...(s.caFile ? { ca: [fs.readFileSync(s.caFile)] } : {}), rejectUnauthorized: !s.insecure }
      : undefined,
  })
  try {
    await client.bind(s.bindDn, s.bindPassword)
    add('AD', 'service account bind', true, s.bindDn)
    const user = arg('--ad-user')
    if (user) {
      const r = await client.search(s.searchBase, {
        filter: `(&(objectCategory=person)(objectClass=user)(sAMAccountName=${escapeLdapFilter(user)}))`,
        scope: 'sub',
        sizeLimit: 1,
        attributes: ['sAMAccountName', 'displayName', 'mail', 'userAccountControl'],
      })
      const e = r.searchEntries[0] as any
      add('AD', `find ${user}`, !!e, e ? `${e.displayName ?? ''} <${e.mail ?? 'no mail'}>` : 'not found under LDAP_SEARCH_BASE')
      if (e) add('AD', `${user} enabled`, !(Number(e.userAccountControl) & 2))
    } else add('AD', 'find user', null, 'skipped (pass --ad-user <sAMAccountName>)')
  } catch (err: any) {
    add('AD', 'service account bind', false, String(err?.message || err).slice(0, 160))
  } finally {
    await client.unbind().catch(() => {})
  }
  const pw = process.env.CHECK_AD_PASSWORD
  const user = arg('--ad-user')
  if (pw && user) {
    const r = await authenticateWithAd(user, pw)
    add('AD', `user bind ${user}`, r.ok, r.ok ? 'credentials accepted' : `${r.kind}: ${r.error}`)
  } else add('AD', 'user bind', null, 'skipped (set CHECK_AD_PASSWORD in the environment)')
}

async function checkPaperless() {
  const base = (process.env.PAPERLESS_BASE_URL ?? process.env.PAPERLESS_URL ?? '').trim().replace(/\/+$/, '')
  const token = (process.env.PAPERLESS_API_TOKEN ?? process.env.PAPERLESS_TOKEN ?? '').trim()
  if (!base || !token) return add('Paperless', 'PAPERLESS_URL + PAPERLESS_TOKEN set', false, 'not configured')
  add('Paperless', 'HTTPS', base.startsWith('https://'), base)
  const h = { Authorization: `Token ${token}`, Accept: 'application/json' }
  try {
    const r = await fetch(`${base}/api/documents/?page_size=1&fields=id`, { headers: h, signal: AbortSignal.timeout(10_000) })
    const body: any = r.ok ? await r.json() : null
    add('Paperless', 'token accepted', r.ok, r.ok ? `${body?.count ?? '?'} documents visible` : `HTTP ${r.status}`)
  } catch (err: any) {
    return add('Paperless', 'reachable', false, String(err?.message || err).slice(0, 160))
  }
  try {
    const r = await fetch(`${base}/api/ui_settings/`, { headers: h, signal: AbortSignal.timeout(10_000) })
    if (r.ok) {
      const perms: string[] = (await r.json())?.permissions ?? []
      const writes = perms.filter(p => /^(add|change|delete)_document$/.test(p))
      add('Paperless', 'token is read-only', writes.length === 0, writes.length ? `can: ${writes.join(', ')}` : `${perms.length} permissions, no document writes`)
    } else add('Paperless', 'token is read-only', null, `cannot read /api/ui_settings/ (HTTP ${r.status})`)
  } catch {
    add('Paperless', 'token is read-only', null, 'not checked')
  }
  const dms = arg('--dms')
  if (dms) {
    try {
      const r = await fetch(`${base}/api/documents/${encodeURIComponent(dms)}/download/`, { headers: { Authorization: `Token ${token}` }, signal: AbortSignal.timeout(20_000) })
      const buf = r.ok ? Buffer.from(await r.arrayBuffer()) : Buffer.alloc(0)
      add('Paperless', `download ${dms}`, r.ok && buf.subarray(0, 4).toString() === '%PDF', r.ok ? `${buf.length} bytes` : `HTTP ${r.status}`)
    } catch (err: any) {
      add('Paperless', `download ${dms}`, false, String(err?.message || err).slice(0, 160))
    }
  } else add('Paperless', 'download PDF', null, 'skipped (pass --dms <paperless document id>)')
}

async function main() {
  await checkAd()
  await checkPaperless()
  const problems = productionConfigProblems()
  add('Config', 'production settings complete', problems.length === 0, problems.length ? `${problems.length} problem(s) — see below` : 'ok')

  const mark = (ok: boolean | null) => (ok === true ? 'PASS' : ok === false ? 'FAIL' : 'SKIP')
  for (const r of rows) console.log(`${mark(r.ok).padEnd(4)}  ${r.area.padEnd(9)} ${r.check.padEnd(34)} ${r.detail}`)
  if (problems.length) for (const p of problems) console.log(`      - ${p}`)
  process.exitCode = rows.some(r => r.ok === false) ? 1 : 0
}

main().catch(err => {
  console.error('[check-integrations] failed:', err)
  process.exit(1)
})
