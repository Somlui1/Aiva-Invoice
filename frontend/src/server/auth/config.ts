/**
 * Server security configuration — read from the environment on every call (so tests can change it).
 *
 * Production fails closed: `productionConfigProblems()` lists every missing / unsafe setting and
 * `server/index.ts` refuses to start while the list is not empty. Nothing here has a "convenient"
 * default that would let production run with a demo secret, an unencrypted LDAP link or open ingest.
 */
import crypto from 'node:crypto'
import { entraConfigProblems } from './entra'

type Env = Record<string, string | undefined>

const trim = (v: string | undefined) => (v ?? '').trim()
const flag = (v: string | undefined) => /^(1|true|yes|on)$/i.test(trim(v))
const list = (v: string | undefined) =>
  trim(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

export const isProduction = (env: Env = process.env) => trim(env.NODE_ENV) === 'production'
export const isTest = (env: Env = process.env) => trim(env.NODE_ENV) === 'test' || !!env.VITEST

/** Session lifetime: 8 hours (one working day). Override with AUTH_SESSION_TTL_HOURS (1–24). */
export function sessionTtlSec(env: Env = process.env): number {
  const h = Number(trim(env.AUTH_SESSION_TTL_HOURS) || 8)
  return Math.round(Math.min(24, Math.max(1, Number.isFinite(h) ? h : 8)) * 3600)
}

let ephemeralSecret: string | null = null

/**
 * HMAC key for session cookies. Production: AUTH_SECRET (>= 32 chars) or nothing works.
 * Dev / test without AUTH_SECRET: a random per-process key (sessions end on restart) — never a
 * constant in the code, so a dev build can never mint cookies that a production server accepts.
 */
export function sessionSecret(env: Env = process.env): string {
  const s = trim(env.AUTH_SECRET)
  if (s.length >= 32) return s
  if (isProduction(env)) throw new Error('AUTH_SECRET is missing or shorter than 32 characters')
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString('hex')
    if (!isTest(env)) console.warn('[auth] AUTH_SECRET not set — using a random key; sessions end when the server restarts')
  }
  return ephemeralSecret
}

/**
 * Developer conveniences (mock login, offline passwords, mock users). Never in production, whatever
 * the flag says. Tests get them so the suite runs without an AD.
 */
export function devAuthEnabled(env: Env = process.env): boolean {
  if (isProduction(env)) return false
  return isTest(env) || flag(env.AUTH_DEV_LOGIN)
}

/**
 * Shared secrets for machine callers. `engine` = System A pushing results, `oracle` = the AP
 * interface callback. Unset outside production = open (local development); unset in production =
 * every call is refused (see requireIntegrationKey).
 */
export function integrationKey(name: 'engine' | 'oracle', env: Env = process.env): string {
  return trim(name === 'engine' ? env.ENGINE_INGEST_KEY : env.ORACLE_CALLBACK_KEY)
}

/** sAMAccountNames that become SA on their first AD login (bootstrap only — later managed in RBAC). */
export const bootstrapAdmins = (env: Env = process.env) => list(env.AUTH_BOOTSTRAP_ADMINS).map(s => s.toLowerCase())

/** Origins allowed to call the API with credentials. Empty = same origin only. */
export const corsOrigins = (env: Env = process.env) => list(env.CORS_ORIGINS)

/** Simulation ingest (/api/ingest) is a development tool. */
export const simulationEnabled = (env: Env = process.env) => !isProduction(env) || flag(env.AIVA_ENABLE_SIMULATION)

/** Sample invoices from temp/ are loaded at start-up only when asked for, and never in production. */
export const sampleSeedEnabled = (env: Env = process.env) =>
  !isProduction(env) && !isTest(env) && trim(env.AIVA_SEED_SAMPLE) !== 'false'

/** Fake PDFs and the temp/ fixture folder are development fallbacks only. */
export const pdfFallbacksEnabled = (env: Env = process.env) => !isProduction(env)

/** Everything production needs and does not have. Empty array = ready to start. */
export function productionConfigProblems(env: Env = process.env): string[] {
  const p: string[] = []
  if (trim(env.AUTH_SECRET).length < 32) p.push('AUTH_SECRET: required, at least 32 characters (openssl rand -hex 32)')
  if (/your-|replace-this|change-?this|changeme|aiva-super-secret|example/i.test(trim(env.AUTH_SECRET))) p.push('AUTH_SECRET: still the template value')
  const ldap = trim(env.LDAP_URL)
  if (!ldap) p.push('LDAP_URL: required')
  else if (!ldap.startsWith('ldaps://')) p.push('LDAP_URL: must be ldaps:// in production (passwords cross the network)')
  if (!trim(env.LDAP_BIND_DN)) p.push('LDAP_BIND_DN: required (read-only service account)')
  if (!trim(env.LDAP_BIND_PASSWORD)) p.push('LDAP_BIND_PASSWORD: required')
  else if (/YourSuperSecret|^support$/i.test(trim(env.LDAP_BIND_PASSWORD))) p.push('LDAP_BIND_PASSWORD: still a template / demo value')
  if (!trim(env.LDAP_SEARCH_BASE)) p.push('LDAP_SEARCH_BASE: required')
  if (/itsupport/i.test(trim(env.LDAP_BIND_DN))) p.push('LDAP_BIND_DN: use a dedicated read-only service account, not itsupport')
  if (!integrationKey('engine', env)) p.push('ENGINE_INGEST_KEY: required (System A sends it on /api/engine/ingest)')
  if (!integrationKey('oracle', env)) p.push('ORACLE_CALLBACK_KEY: required (AP interface callback)')
  if (!trim(env.DATABASE_URL)) p.push('DATABASE_URL: required')
  if (!trim(env.PAPERLESS_URL || env.PAPERLESS_BASE_URL)) p.push('PAPERLESS_URL: required (no fake PDFs in production)')
  if (!trim(env.PAPERLESS_TOKEN || env.PAPERLESS_API_TOKEN)) p.push('PAPERLESS_TOKEN: required (read-only Paperless user)')
  if (flag(env.AUTH_DEV_LOGIN)) p.push('AUTH_DEV_LOGIN: must not be set in production')
  if (flag(env.VITE_AUTH_MOCK) || flag(env.VITE_AUTH_BYPASS)) p.push('VITE_AUTH_MOCK / VITE_AUTH_BYPASS: must be false for the production build')
  // Microsoft 365 (Entra ID) is optional; when any ENTRA_* is set, all of it must be right.
  p.push(...entraConfigProblems(env))
  return p
}
