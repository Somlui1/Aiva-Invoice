/**
 * Interactive Validation Card Click & Bi-directional Navigation Tests.
 * Design: docs/plans/2026-10-11-validation-evidence-pdf-linking-design.md
 * Plan:   docs/plans/2026-10-11-validation-evidence-pdf-linking.md
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { INITIAL_DOCS } from '../mock/initialDocs'

function ContextMonitor({ onState }: { onState: (ctx: ReturnType<typeof useInvoices>) => void }) {
  const ctx = useInvoices()
  onState(ctx)
  return null
}

function Providers({ children, onState }: { children: React.ReactNode; onState?: (ctx: any) => void }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>
              {onState && <ContextMonitor onState={onState} />}
              {children}
            </SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

describe('Task 4: Interactive Validation Card Click & Bi-directional Navigation', () => {
  it('triggers openEvidenceDock and sets active selection when clicking an .exc card', async () => {
    let contextState: any
    const failingDoc = INITIAL_DOCS.find(d => d.rules.some(r => r.status === 'FAIL')) || INITIAL_DOCS[0]

    render(
      <Providers onState={ctx => { contextState = ctx }}>
        <InvoiceDetailPane doc={failingDoc} onOpenActionModal={() => {}} />
      </Providers>
    )

    const cards = document.querySelectorAll('.exc')
    expect(cards.length).toBeGreaterThan(0)
    const firstCard = cards[0] as HTMLElement

    // Click the card
    await act(async () => {
      fireEvent.click(firstCard)
    })

    // Expect dock to be open
    expect(contextState.isEvidenceDockOpen).toBe(true)
    expect(contextState.evidenceDockFocus).not.toBeNull()
    expect(contextState.evidenceSelection).not.toBeNull()
    expect(contextState.evidenceSelection?.ruleId).toBe(firstCard.getAttribute('data-rule'))

    // Expect active card to have is-active and category class
    expect(firstCard.classList.contains('is-active')).toBe(true)
    expect(firstCard.className).toMatch(/cat-(missing|mismatch|calculation|duplicate)/)
  })

  it('switches active state and clears previous selection when a second card is clicked', async () => {
    let contextState: any
    const failingDoc = INITIAL_DOCS.find(d => d.rules.filter(r => r.status === 'FAIL').length > 1) || INITIAL_DOCS[0]

    render(
      <Providers onState={ctx => { contextState = ctx }}>
        <InvoiceDetailPane doc={failingDoc} onOpenActionModal={() => {}} />
      </Providers>
    )

    const cards = document.querySelectorAll('.exc')
    expect(cards.length).toBeGreaterThanOrEqual(2)

    const firstCard = cards[0] as HTMLElement
    const secondCard = cards[1] as HTMLElement

    // Click card 1
    await act(async () => {
      fireEvent.click(firstCard)
    })
    expect(firstCard.classList.contains('is-active')).toBe(true)
    expect(secondCard.classList.contains('is-active')).toBe(false)
    const rule1 = firstCard.getAttribute('data-rule')
    expect(contextState.evidenceSelection?.ruleId).toBe(rule1)

    // Click card 2
    await act(async () => {
      fireEvent.click(secondCard)
    })
    expect(firstCard.classList.contains('is-active')).toBe(false)
    expect(secondCard.classList.contains('is-active')).toBe(true)
    const rule2 = secondCard.getAttribute('data-rule')
    expect(contextState.evidenceSelection?.ruleId).toBe(rule2)
  })
})
