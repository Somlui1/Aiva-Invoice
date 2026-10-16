/**
 * @vitest-environment jsdom
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { EvidenceViewerDock } from '../components/evidence/EvidenceViewerDock'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { SimProvider } from '../context/SimContext'
import type { InvoiceDoc } from '../types/invoice'

const multiPageDoc: InvoiceDoc = {
  id: 'DMS-100',
  doc: 'DMS-100',
  dmsDocId: 'DMS-100',
  fileSha256: 'sha-multi-100',
  pages: 3,
  pageCount: 3,
  invoiceNum: 'INV-MP-100',
  invoiceDate: '2026-10-16',
  companyCode: 'AH',
  supplierTaxId: '0105500000001',
  supplierName: 'AAPICO Test MultiPage',
  grandTotal: 45000,
  currency: 'THB',
  status: 'Review',
  recommendation: 'REVIEW',
  maxSeverity: 'Medium',
  assignedRole: 'APR',
  apStatus: 'unconfirmed',
  confidenceScore: 0.95,
  sourceCategory: 'PDF',
  receivedDate: '2026-10-16',
  extractedFields: {} as any,
  lineItems: [],
  validationProgress: {} as any,
  validationSteps: [],
  duplicateCheck: {} as any,
  auditTrail: [],
  rawValidation: {} as any,
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function Wrapper({ children }: { children: React.ReactNode }) {
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

describe('PDF Default Clean View & Continuous Multi-Page Scroll', () => {
  it('defaults to showEvidence = false (clean document view) on initial open', () => {
    render(
      <Wrapper>
        <EvidenceViewerDock doc={multiPageDoc} />
      </Wrapper>
    )

    // The 'เอกสาร' segment button should have the .on class
    const docBtn = screen.getByRole('button', { name: /เอกสาร/i })
    const evidenceBtn = screen.getByRole('button', { name: /หลักฐาน/i })

    expect(docBtn.classList.contains('on')).toBe(true)
    expect(evidenceBtn.classList.contains('on')).toBe(false)
  })

  it('toggles evidence on when user clicks "หลักฐาน"', () => {
    render(
      <Wrapper>
        <EvidenceViewerDock doc={multiPageDoc} />
      </Wrapper>
    )

    const docBtn = screen.getByRole('button', { name: /เอกสาร/i })
    const evidenceBtn = screen.getByRole('button', { name: /หลักฐาน/i })

    act(() => {
      fireEvent.click(evidenceBtn)
    })

    expect(evidenceBtn.classList.contains('on')).toBe(true)
    expect(docBtn.classList.contains('on')).toBe(false)
  })

  it('renders continuous scrollable dock body with multiple pages support', () => {
    const { container } = render(
      <Wrapper>
        <EvidenceViewerDock doc={multiPageDoc} />
      </Wrapper>
    )

    const dockBody = container.querySelector('.dock-body.evd')
    expect(dockBody).not.toBeNull()
  })
})
