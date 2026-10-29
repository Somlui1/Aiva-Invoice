/**
 * v5.13 — ตั้งค่า › ตั้งค่าทั่วไป: ภาษาเมนู ไทย / English
 *
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, type RenderResult } from '@testing-library/react'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { InvoiceProvider } from '../context/InvoiceContext'
import { Sidebar } from '../components/layout/Sidebar'
import { GeneralSettingsPage } from '../components/settings/GeneralSettingsPage'
import { getLang, setLang, translate } from '../lib/i18n'
import type { User } from '../types/auth'

const ACC: User = { id: 'acc.test', n: 'ACC Tester', email: 'acc@aapico.com', role: 'ACC', rcvName: '—', emp: null, co: ['AH'], unit: 'Accounting' }
const ADM: User = { id: 'adm.test', n: 'ADM Tester', email: 'adm@aapico.com', role: 'ADM', rcvName: '—', emp: null, co: [], unit: 'IT' }

async function mount(ui: React.ReactElement, user: User): Promise<RenderResult> {
  let r: RenderResult | undefined
  await act(async () => {
    r = render(
      <AuthProvider initialUser={user}>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>{ui}</InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>,
    )
    await new Promise(res => setTimeout(res, 0))
  })
  return r as RenderResult
}

afterEach(() => cleanup())

describe('v5.13 i18n store', () => {
  it('defaults to Thai, persists the choice, falls back to Thai for a missing key', () => {
    expect(getLang()).toBe('th')
    setLang('en')
    expect(getLang()).toBe('en')
    expect(window.localStorage.getItem('aiva.lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(translate('en', 'nav.queue')).toBe('Review queue')
    expect(translate('th', 'nav.newDocs', { n: 3 })).toContain('3')
    setLang('xx' as never)
    expect(getLang()).toBe('en')
  })
})

describe('v5.13 sidebar: ตั้งค่า › ตั้งค่าทั่วไป', () => {
  it('every role has the settings section (ADM included)', async () => {
    const { container } = await mount(<Sidebar currentPage="queue" onNavigate={() => {}} onToggleNav={() => {}} />, ADM)
    const secs = Array.from(container.querySelectorAll('.nav-sec')).map(e => e.textContent)
    expect(secs).toEqual(['การกำกับดูแล', 'ตั้งค่า'])
    expect(screen.getByText('ตั้งค่าทั่วไป')).toBeDefined()
  })

  it('switching to English on the settings page re-labels the menu', async () => {
    const { container } = await mount(
      <>
        <Sidebar currentPage="settings" onNavigate={() => {}} onToggleNav={() => {}} />
        <GeneralSettingsPage />
      </>,
      ACC,
    )
    act(() => screen.getByRole('radio', { name: 'English' }).click())
    const secs = Array.from(container.querySelectorAll('.nav-sec')).map(e => e.textContent)
    expect(secs).toEqual(['To do', 'Payables (AP)', 'Tracking & history', 'Governance', 'Settings'])
    expect(screen.getByRole('radio', { name: 'English' }).getAttribute('aria-checked')).toBe('true')
    act(() => screen.getByRole('radio', { name: 'ไทย' }).click())
    expect(container.querySelector('.nav-sec')?.textContent).toBe('ต้องดำเนินการ')
  })
})
