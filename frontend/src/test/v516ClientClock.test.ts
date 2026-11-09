import { afterEach, describe, expect, it, vi } from 'vitest'
import { daysBetween, isoToLocalDay, localDay, msUntilNextLocalDay, todayISO } from '../lib/clientClock'
import { perRange, docDateFor } from '../lib/queueFilters'
import type { InvoiceDoc } from '../types/invoice'

describe('v5.16 client clock (date filter no longer frozen on 2026-10-07)', () => {
  afterEach(() => vi.useRealTimers())

  it('today follows the client clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 9, 10, 0, 0)) // 9 Nov 2026 local
    expect(todayISO()).toBe('2026-11-09')
    expect(perRange({ k: 'month' })).toEqual(['2026-11-01', '2026-11-30'])
    expect(perRange({ k: 'lastm' })).toEqual(['2026-10-01', '2026-10-31'])
    expect(perRange({ k: 'today' })).toEqual(['2026-11-09', '2026-11-09'])
    expect(perRange({ k: '7d' })).toEqual(['2026-11-03', '2026-11-09'])
    vi.setSystemTime(new Date(2027, 0, 1, 0, 0, 5)) // rolls over without a reload
    expect(perRange({ k: 'month' })).toEqual(['2027-01-01', '2027-01-31'])
    expect(perRange({ k: 'lastm' })).toEqual(['2026-12-01', '2026-12-31'])
  })

  it('an explicit "today" can be passed', () => {
    expect(perRange({ k: 'month' }, '2026-02-10')).toEqual(['2026-02-01', '2026-02-28'])
  })

  it('date-only values are calendar days; timestamps become the local day', () => {
    expect(isoToLocalDay('2026-10-05')).toBe('2026-10-05')
    expect(isoToLocalDay('')).toBe('')
    const instant = '2026-10-31T23:30:00Z'
    expect(isoToLocalDay(instant)).toBe(localDay(new Date(instant)))
  })

  it('the queue filters on the local day of upAt when present', () => {
    const d = { up: '2026-10-31', upAt: '2026-10-31T23:30:00Z', dt: '2026-10-30' } as unknown as InvoiceDoc
    expect(docDateFor(d, 'updated')).toBe(localDay(new Date('2026-10-31T23:30:00Z')))
    expect(docDateFor(d, 'invoice')).toBe('2026-10-30')
    expect(docDateFor({ up: '2026-10-09' } as unknown as InvoiceDoc, 'updated')).toBe('2026-10-09')
  })

  it('helpers', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(daysBetween(undefined, '2026-11-02')).toBe(0)
    expect(msUntilNextLocalDay(new Date(2026, 10, 9, 23, 59, 0))).toBe(61_000)
  })
})
