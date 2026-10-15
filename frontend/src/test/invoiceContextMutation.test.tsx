/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { InvoiceProvider, useInvoices } from '../context/InvoiceContext'
import { AuthProvider } from '../context/AuthContext'
import { SettingsProvider } from '../context/SettingsContext'
import { ToastModalProvider } from '../context/ToastModalContext'
import React from 'react'

describe('InvoiceContext Server Action Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.localStorage.setItem('aiva.auth.user', 'u4')
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
      <AuthProvider>
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
    const { GET: getAuditLogs } = await import('../app/api/audit-logs/route')
    const { prisma } = await import('../lib/prisma')

    const testAudit = await prisma.auditLog.create({
      data: {
        docId: 'DMS-AUDIT-TEST',
        who: 'สมชาย วงศ์ทอง',
        role: 'APR',
        act: 'Confirm',
        detail: 'ทดสอบดึง log จากฐานข้อมูล',
      },
    })

    const res = await getAuditLogs()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(Array.isArray(data.logs)).toBe(true)
    expect(data.logs.some((l: any) => l.doc === 'DMS-AUDIT-TEST')).toBe(true)

    await prisma.auditLog.delete({ where: { id: testAudit.id } })
  })
})
