/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import { USERS } from '../mock/users'
import React from 'react'

describe('InvoiceContext Server Action Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.setItem('aiva.auth.user', USERS[0].id)
  })

  it('calls POST /api/documents/[id]/actions when executeAction is invoked', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any, opts: any) => {
      const urlStr = String(url)
      if (urlStr.includes('/api/documents?include=boxes')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            documents: [{ doc: 'DMS-100', id: 'DMS-100', status: 'Auto-pass', company: 'AH', rules: [], history: [] }],
          }),
        } as Response
      }
      if (urlStr.includes('/api/documents/DMS-100/actions')) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            document: { doc: 'DMS-100', id: 'DMS-100', status: 'Confirmed', company: 'AH', rules: [], history: [] },
            message: 'Confirmed สำเร็จ',
          }),
        } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={USERS[0]}>
        <SettingsProvider>
          <ToastModalProvider>
            <InvoiceProvider>{children}</InvoiceProvider>
          </ToastModalProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    const { result } = renderHook(() => useInvoices(), { wrapper })

    const targetId = result.current.docs[0].doc

    let actionRes: any
    await act(async () => {
      actionRes = await result.current.executeAction(targetId, 'confirm', 'ผ่านการตรวจ', 'หมายเหตุ')
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`/api/documents/${encodeURIComponent(targetId)}/actions`),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
    expect(actionRes.ok).toBe(true)
  })

  it('fetches live audit logs from GET /api/audit-logs', async () => {
    const { createExpressApp } = await import('../../server/app')
    const request = (await import('supertest')).default
    const { prisma } = await import('../lib/prisma')

    const testAudit = await prisma.auditLog.create({
      data: {
        docId: 'DMS-AUDIT-TEST',
        who: 'Wajeepradit Prompan',
        role: 'APR',
        act: 'Confirm',
        detail: 'ทดสอบดึง log จากฐานข้อมูล',
      },
    })

    const app = createExpressApp()
    const res = await request(app).get('/api/audit-logs')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(Array.isArray(res.body.logs)).toBe(true)
    expect(res.body.logs.some((l: any) => l.doc === 'DMS-AUDIT-TEST')).toBe(true)

    await prisma.auditLog.delete({ where: { id: testAudit.id } })
  }, 15000)
})
