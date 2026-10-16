/**
 * Database Clear Script for AIVA Invoice Automation System.
 *
 * Supports two operational modes:
 *  - 'data': Clears all transaction data (Document, DocumentBBox, ValidationRun, ApBatch)
 *            and AuditLog, while strictly preserving User, UserCompany, and UserReceiverMap.
 *  - 'logs': Clears only AuditLog records, leaving all invoices, runs, and users intact.
 */
import fs from 'node:fs'
import path from 'node:path'
import { prisma } from '../src/lib/prisma'

export interface ClearDatabaseResult {
  ok: boolean
  mode: 'data' | 'logs'
  logsCleared: number
  documentsCleared?: number
  bboxesCleared?: number
  runsCleared?: number
  batchesCleared?: number
  error?: string
}

export async function clearDatabase(mode: 'data' | 'logs'): Promise<ClearDatabaseResult> {
  try {
    if (mode === 'logs') {
      const res = await prisma.auditLog.deleteMany()
      console.log(`[ClearDatabase] Cleared ${res.count} AuditLog rows.`)
      return {
        ok: true,
        mode: 'logs',
        logsCleared: res.count,
      }
    }

    // Mode: 'data' (Full transaction wipe with RBAC preservation)
    const [delLogs, delBBoxes, delRuns, delBatches, delDocs] = await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.documentBBox.deleteMany(),
      prisma.validationRun.deleteMany(),
      prisma.apBatch.deleteMany(),
      prisma.document.deleteMany(),
    ])

    // Create marker file so autoSeedSample does not auto-populate on next reboot
    try {
      const markerPath = path.resolve(process.cwd(), '.cleared')
      fs.writeFileSync(markerPath, JSON.stringify({ clearedAt: new Date().toISOString() }, null, 2))
    } catch (markerErr: any) {
      console.warn('[ClearDatabase] Note: Could not write .cleared marker:', markerErr.message)
    }

    console.log(
      `[ClearDatabase] Transaction data cleared successfully: ` +
        `${delDocs.count} Documents, ${delRuns.count} Runs, ${delBBoxes.count} BBoxes, ` +
        `${delBatches.count} AP Batches, ${delLogs.count} Logs. ` +
        `Users and permissions preserved.`
    )

    return {
      ok: true,
      mode: 'data',
      logsCleared: delLogs.count,
      bboxesCleared: delBBoxes.count,
      runsCleared: delRuns.count,
      batchesCleared: delBatches.count,
      documentsCleared: delDocs.count,
    }
  } catch (err: any) {
    console.error('[ClearDatabase] Error clearing database:', err)
    return {
      ok: false,
      mode,
      logsCleared: 0,
      error: err.message,
    }
  }
}

// CLI Execution entrypoint
const isDirectRun =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith('clear-database.ts') || process.argv[1].endsWith('clear-database.js'))

if (isDirectRun) {
  const modeArg = process.argv.find(arg => arg.startsWith('--mode='))
  const mode = modeArg ? (modeArg.split('=')[1] as 'data' | 'logs') : 'data'

  clearDatabase(mode)
    .then((result) => {
      if (result.ok) {
        console.log(`[ClearDatabase] Completed successfully in mode "${mode}".`)
        process.exit(0)
      } else {
        console.error(`[ClearDatabase] Failed: ${result.error}`)
        process.exit(1)
      }
    })
    .catch((err) => {
      console.error('[ClearDatabase] Fatal error:', err)
      process.exit(1)
    })
}
