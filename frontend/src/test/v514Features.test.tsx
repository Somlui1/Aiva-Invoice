/**
 * v5.14 — receiver suggestions (RBAC) · view-as actions · language switch · open-document request
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { foldReceivers } from '../server/receiverDirectory'
import { ReceiverPicker, rankReceivers, __resetReceiverCache, type ReceiverSuggestion } from '../components/governance/rbac/ReceiverPicker'
import { LangSwitch } from '../components/shell/LangSwitch'
import { getLang, setLang } from '../lib/i18n'
import { OPEN_DOC_EVENT, requestOpenDocument } from '../lib/openDocument'
import { viewAsActionsEnabled, viewAsDocId } from '../server/viewAs'

const tick = () => new Promise(r => setTimeout(r, 0))

describe('foldReceivers (server)', () => {
  it('one entry per normalised name, most frequent spelling, counts, companies, bindings', () => {
    const out = foldReceivers(
      [
        { receiverName: 'AHT Die Making 03, K.Vinitda', companyCode: 'AHT', count: 5, lastSeen: '2026-10-20' },
        { receiverName: 'AHT DIE MAKING 03,  K.VINITDA', companyCode: 'AH', count: 1, lastSeen: '2026-10-26' },
        { receiverName: 'Oracle, Concurrent', companyCode: 'AH', count: 2 },
        { receiverName: '—', companyCode: 'AH', count: 9 },
        { receiverName: null, companyCode: 'AH', count: 9 },
      ],
      [{ receiverName: 'aht die making 03, k.vinitda', userId: 'u1', userName: 'Vinitda' }],
    )
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ name: 'AHT Die Making 03, K.Vinitda', docs: 6, companies: ['AH', 'AHT'], lastSeen: '2026-10-26' })
    expect(out[0].boundTo).toEqual([{ id: 'u1', name: 'Vinitda' }])
    expect(out[1].boundTo).toEqual([])
  })
})

const SUG: ReceiverSuggestion[] = [
  { name: 'AHT Die Making 03, K.Vinitda', key: 'AHT DIE MAKING 03, K.VINITDA', docs: 40, companies: ['AHT'], lastSeen: null, boundTo: [] },
  { name: 'AHA Jig Making 02, K.Unchalee K.', key: 'AHA JIG MAKING 02, K.UNCHALEE K.', docs: 12, companies: ['AHA'], lastSeen: null, boundTo: [{ id: 'u9', name: 'Other' }] },
  { name: 'AHT Die Making 01', key: 'AHT DIE MAKING 01', docs: 3, companies: ['AHT'], lastSeen: null, boundTo: [] },
]

describe('rankReceivers', () => {
  it('excludes what the user already has (case/space-insensitive) and ranks exact > prefix > contains', () => {
    expect(rankReceivers(SUG, '', ['aht die making 03,  k.vinitda']).map(s => s.docs)).toEqual([12, 3])
    expect(rankReceivers(SUG, 'die making', []).map(s => s.docs)).toEqual([40, 3])
    expect(rankReceivers(SUG, 'aht die making 01', [])[0].docs).toBe(3)
    expect(rankReceivers(SUG, 'jig unchalee', [])).toHaveLength(1)
  })
})

describe('ReceiverPicker', () => {
  beforeEach(() => {
    __resetReceiverCache()
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, receivers: SUG }))))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  async function mount(value: string[] = []) {
    const onAdd = vi.fn()
    await act(async () => {
      render(<ReceiverPicker value={value} onAdd={onAdd} selfUserId="u1" />)
      await tick()
    })
    return { onAdd, input: screen.getByRole('combobox') as HTMLInputElement }
  }

  it('shows suggestions with doc counts and "already bound" note; Enter adds the highlighted one', async () => {
    const { onAdd, input } = await mount()
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'jig' } })
    })
    expect(screen.getByText('AHA Jig Making 02, K.Unchalee K.')).toBeTruthy()
    expect(screen.getByText('ผูกกับ Other อยู่แล้ว')).toBeTruthy()
    await act(async () => fireEvent.keyDown(input, { key: 'Enter' }))
    expect(onAdd).toHaveBeenCalledWith('AHA Jig Making 02, K.Unchalee K.')
    expect(input.value).toBe('')
  })

  it('blur never adds a half-typed name (it stays, with a hint); an exact match is added on blur', async () => {
    const { onAdd, input } = await mount()
    await act(async () => {
      fireEvent.change(input, { target: { value: 'AHT Die' } })
      fireEvent.blur(input)
    })
    expect(onAdd).not.toHaveBeenCalled()
    expect(input.value).toBe('AHT Die')
    expect(screen.getByRole('status').textContent).toContain('ยังไม่ได้เพิ่ม')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'aht die making 01' } })
      fireEvent.blur(input)
    })
    expect(onAdd).toHaveBeenCalledWith('AHT Die Making 01')
  })

  it('free text not on any document can still be added, marked as such; duplicates are ignored', async () => {
    const { onAdd, input } = await mount(['AHT Die Making 01'])
    await act(async () => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'New Receiver X' } })
    })
    expect(screen.getByText('ไม่พบในเอกสาร · ตรวจให้ตรงกับ RECEIVER ใน Oracle ทุกตัวอักษร')).toBeTruthy()
    await act(async () => fireEvent.keyDown(input, { key: 'Enter' }))
    expect(onAdd).toHaveBeenLastCalledWith('New Receiver X')

    onAdd.mockClear()
    await act(async () => {
      fireEvent.change(input, { target: { value: 'aht  die making 01' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })
    expect(onAdd).not.toHaveBeenCalled()
  })
})

describe('LangSwitch', () => {
  afterEach(() => {
    cleanup()
    setLang('th')
  })
  it('TH | EN in the top bar switches the same setting as ตั้งค่า › ตั้งค่าทั่วไป', async () => {
    render(<LangSwitch />)
    expect(screen.getByRole('radio', { name: 'TH' }).getAttribute('aria-checked')).toBe('true')
    await act(async () => screen.getByRole('radio', { name: 'EN' }).click())
    expect(getLang()).toBe('en')
    expect(screen.getByRole('radio', { name: 'EN' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radiogroup').hasAttribute('data-no-i18n')).toBe(true)
  })
})

describe('openDocument request + view-as helpers', () => {
  it('dispatches one event with pdf=true by default', () => {
    const seen: unknown[] = []
    const on = (e: Event) => seen.push((e as CustomEvent).detail)
    window.addEventListener(OPEN_DOC_EVENT, on)
    requestOpenDocument('DMS-1')
    requestOpenDocument('DMS-2', { pdf: false })
    window.removeEventListener(OPEN_DOC_EVENT, on)
    expect(seen).toEqual([{ id: 'DMS-1', pdf: true }, { id: 'DMS-2', pdf: false }])
  })
  it('view-as actions on by default; VIEW_AS_ACTIONS=off turns them off', () => {
    expect(viewAsActionsEnabled({})).toBe(true)
    expect(viewAsActionsEnabled({ VIEW_AS_ACTIONS: 'off' })).toBe(false)
    expect(viewAsActionsEnabled({ VIEW_AS_ACTIONS: 'FALSE' })).toBe(false)
    expect(viewAsDocId('/api/documents/DMS-12/actions')).toBe('DMS-12')
    expect(viewAsDocId('/api/ap/batches')).toBe('VIEW_AS')
  })
})
