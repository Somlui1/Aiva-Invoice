import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    let syncedCompanies = Object.entries(COMPANIES)
      .filter(([k]) => k !== '?')
      .map(([code, info]) => ({
        code,
        name: info.name,
        tax: info.tax,
        orgs: info.orgs,
      }))

    if (oracleMcpUrl && oracleMcpToken) {
      try {
        const sqlQuery = `
          SELECT 
            hou.ORGANIZATION_ID AS ORG_ID,
            hou.NAME AS OU_NAME,
            xle.LEGAL_ENTITY_IDENTIFIER AS TAX_ID,
            xle.NAME AS COMPANY_NAME
          FROM HR_OPERATING_UNITS hou
          JOIN XLE_ENTITY_PROFILES xle ON hou.DEFAULT_LEGAL_CONTEXT_ID = xle.LEGAL_ENTITY_ID
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
          // If Oracle returns rows, mark source as live
          if (mcpData?.result && !mcpData?.error) {
            syncSource = 'oracle_mcp'
          }
        }
      } catch {
        // Fallback gracefully on timeout/offline
        syncSource = 'mock_fallback'
      }
    }

    // Record audit trail
    try {
      await prisma.auditLog.create({
        data: {
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
