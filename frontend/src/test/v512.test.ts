/**
 * v5.12 — SSE scoping, "ล้างเฉพาะเอกสาร" gate, cookie Secure modes. No database needed except the
 * deactivation ping, which is not exercised here.
 */
import { EventEmitter } from 'node:events'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { eventsHandler, publishDocEvent, openStreams } from '../server/events'
import { checkClearAllowed } from '../server/dbReset'
import { cookieSecure } from '../server/auth/config'

function fakeStream(user: any) {
  const req = new EventEmitter() as any
  req.sessionUser = user
  const out: string[] = []
  const res: any = {
    status: () => res,
    setHeader: () => {},
    flushHeaders: () => {},
    write: (s: string) => out.push(s),
    end: () => {},
  }
  eventsHandler(req, res)
  const events = () =>
    out
      .join('')
      .split('\n\n')
      .filter(b => b.startsWith('event:'))
      .map(b => ({ event: b.split('\n')[0].slice(7), data: JSON.parse(b.split('\n')[1].slice(6)) }))
  return { close: () => req.emit('close'), events }
}

describe('SSE /api/events — each user only hears about documents they may see', () => {
  it('scopes by company / receiver; ADM gets a content-free audit tick', () => {
    const acc = fakeStream({ id: 'a', role: 'ACC', companies: ['AH'], receivers: [] })
    const eu = fakeStream({ id: 'e', role: 'EU', companies: [], receivers: ['R One'] })
    const adm = fakeStream({ id: 'm', role: 'ADM', companies: [], receivers: [] })

    publishDocEvent({ kind: 'new', docId: 'DMS-1', status: 'Review', company: 'AH', receiver: 'R ONE', title: 't' })
    publishDocEvent({ kind: 'new', docId: 'DMS-2', status: 'Review', company: 'AHT', receiver: 'Other', title: 't' })

    const docsOf = (s: ReturnType<typeof fakeStream>) => s.events().filter(e => e.event === 'doc').map(e => e.data.docId)
    expect(docsOf(acc)).toEqual(['DMS-1'])
    expect(docsOf(eu)).toEqual(['DMS-1'])
    expect(docsOf(adm)).toEqual([])
    expect(adm.events().filter(e => e.event === 'audit')).toHaveLength(2)
    expect(adm.events().some(e => JSON.stringify(e.data).includes('DMS'))).toBe(false)
    expect(acc.events()[0].event).toBe('ready')

    const before = openStreams()
    acc.close()
    eu.close()
    adm.close()
    expect(openStreams()).toBe(before - 3)
  })
})

describe('checkClearAllowed — ล้างเฉพาะเอกสาร', () => {
  it('SQLite + --yes, also in production; anything else refused', () => {
    expect(checkClearAllowed({ databaseUrl: 'file:/app/data/aiva.db', cwd: '/app', yes: true, production: true })).toEqual({
      ok: true,
      file: path.resolve('/app/data/aiva.db'),
    })
    expect(checkClearAllowed({ databaseUrl: 'file:/app/data/aiva.db', cwd: '/app', yes: false, production: true }).ok).toBe(false)
    expect(checkClearAllowed({ databaseUrl: 'sqlserver://x', cwd: '/app', yes: true, production: true }).ok).toBe(false)
    expect(checkClearAllowed({ databaseUrl: '', cwd: '/app', yes: true, production: true }).ok).toBe(false)
  })
})

describe('cookieSecure', () => {
  const http = { secure: false, headers: {} }
  const https = { secure: false, headers: { 'x-forwarded-proto': 'https' } }
  it('auto follows the request; true/false force; unset keeps production = Secure', () => {
    expect(cookieSecure(http, { COOKIE_SECURE: 'auto', NODE_ENV: 'production' })).toBe(false)
    expect(cookieSecure(https, { COOKIE_SECURE: 'auto', NODE_ENV: 'production' })).toBe(true)
    expect(cookieSecure(http, { COOKIE_SECURE: 'true' })).toBe(true)
    expect(cookieSecure(https, { COOKIE_SECURE: 'false' })).toBe(false)
    expect(cookieSecure(http, { NODE_ENV: 'production' })).toBe(true)
    expect(cookieSecure(http, {})).toBe(false)
  })
})
