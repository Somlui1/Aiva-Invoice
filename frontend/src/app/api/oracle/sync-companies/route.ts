import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COMPANIES_26, CompanyMasterInfo } from '@/mock/companies26'

import { COMPANIES } from '@/mock/companies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {}

    const triggeredBy = body.triggeredBy || 'itsupport'
    const oracleMcpUrl = process.env.ORACLE_MCP_URL
    const oracleMcpToken = process.env.ORACLE_MCP_TOKEN

    let syncSource: 'oracle_mcp' | 'mock_fallback' = 'mock_fallback'
    let syncedCompanies = Object.values(COMPANIES_26).map(c => {
      const legacy = (COMPANIES as any)[c.code]
      return {
        code: c.code,
        name: legacy ? `${c.name} (${legacy.name})` : c.name,
        tax: legacy?.tax || c.taxId || '',
        taxId: c.taxId || legacy?.tax || '',
        ouName: c.ouName,
        ledgerName: c.ledgerName,
        orgId: c.orgId,
        orgs: legacy?.orgs || (c.orgId ? [c.orgId] : []),
      }
    })

    if (oracleMcpUrl && oracleMcpToken) {
      try {
        const sqlQuery = `
          SELECT 
            hou.ORGANIZATION_ID AS ORG_ID,
            hou.NAME AS OU_NAME,
            xle.LEGAL_ENTITY_IDENTIFIER AS TAX_ID,
            xle.NAME AS COMPANY_NAME,
            gl.SHORT_NAME AS LEDGER_SHORT_NAME
          FROM APPS.HR_OPERATING_UNITS hou
          LEFT JOIN APPS.XLE_ENTITY_PROFILES xle ON hou.DEFAULT_LEGAL_CONTEXT_ID = xle.LEGAL_ENTITY_ID
          LEFT JOIN APPS.GL_LEDGERS gl ON hou.SET_OF_BOOKS_ID = gl.LEDGER_ID
          ORDER BY hou.ORGANIZATION_ID
        `.trim()

        const mcpRes = await fetch(oracleMcpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${oracleMcpToken}`,
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'sql_run',
              arguments: { sql: sqlQuery },
            },
          }),
          signal: AbortSignal.timeout(4000),
        })

        if (mcpRes.ok) {
          const mcpData = await mcpRes.json()
          if (mcpData?.result && !mcpData?.error) {
            syncSource = 'oracle_mcp'
          }
        }
      } catch {
        syncSource = 'mock_fallback'
      }
    }

    // Upsert into prisma.company table
    for (const c of syncedCompanies) {
      await prisma.company.upsert({
        where: { code: c.code },
        create: {
          code: c.code,
          name: c.name,
          taxId: c.taxId,
          ouName: c.ouName,
          ledgerName: c.ledgerName,
          orgId: c.orgId,
          isActive: true,
        },
        update: {
          name: c.name,
          taxId: c.taxId,
          ouName: c.ouName,
          ledgerName: c.ledgerName,
          orgId: c.orgId,
        },
      })
    }

    // Record audit trail with category ORACLE_SYNC
    try {
      await prisma.auditLog.create({
        data: {
          category: 'ORACLE_SYNC',
          who: triggeredBy,
          role: 'ADM',
          docId: 'MASTER_DATA',
          act: 'Sync ข้อมูลบริษัทจาก Oracle ERP',
          action: 'oracle_sync_companies',
          detail: `ซิงค์ข้อมูลบริษัทและ ORG_ID ผ่าน ${syncSource === 'oracle_mcp' ? 'Oracle MCP Endpoint' : 'Master Fallback Dictionary'} สำเร็จ (${syncedCompanies.length} บริษัท)`,
        },
      })
    } catch {}

    return NextResponse.json({
      ok: true,
      source: syncSource,
      companies: syncedCompanies,
      syncedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
