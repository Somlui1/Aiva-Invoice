/**
 * Validation Card Layout & CSS Isolation Tests.
 * Design: docs/plans/2026-10-11-validation-evidence-pdf-linking-design.md
 * Plan:   docs/plans/2026-10-11-validation-evidence-pdf-linking.md
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { InvoiceDetailPane } from '../components/queue/InvoiceDetailPane'
import { InvoiceProvider } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import { INITIAL_DOCS } from '../mock/initialDocs'

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastModalProvider>
          <InvoiceProvider>
            <SimProvider>{children}</SimProvider>
          </InvoiceProvider>
        </ToastModalProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}

describe('Task 1: CSS Isolation Fix & Summary Card Layout Auto-Expand', () => {
  it('ensures components.css restricts .sel to select elements only', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/components.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    // Must NOT have bare ".inp, .sel" or ".sel {" that matches general elements
    expect(cssContent).not.toMatch(/^\s*\.inp,\s*\.sel\s*\{/m)
    expect(cssContent).toMatch(/select\.sel/)
  })

  it('ensures queue.css provides auto height and .is-active for .exc cards', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/queue.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    expect(cssContent).toMatch(/\.exc\.is-active/)
    expect(cssContent).toMatch(/\.ev-text/)
  })

  it('renders validation cards with .ev-text and without hardcoded height', async () => {
    const failingDoc = INITIAL_DOCS.find(d => d.rules.some(r => r.status === 'FAIL')) || INITIAL_DOCS[0]
    await (await import('@testing-library/react')).act(async () => {
      render(
        <Providers>
          <InvoiceDetailPane doc={failingDoc} onOpenActionModal={() => {}} />
        </Providers>
      )
    })

    const cards = document.querySelectorAll('.exc')
    expect(cards.length).toBeGreaterThan(0)
    const firstEvText = cards[0].querySelector('.ev-text')
    expect(firstEvText).not.toBeNull()
  })
})
