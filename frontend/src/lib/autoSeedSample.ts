import fs from 'node:fs'
import path from 'node:path'
import { prisma } from './prisma'
import { transformEngineResultToPortalDoc } from '@/features/engine/adapters/engineToPortalAdapter'

/**
 * Ensures production database is populated with sample data from `temp/paperless_invoices_v5`
 * when running standalone without a live Engine service.
 */
export async function ensureProductionSampleData(): Promise<void> {
  try {
    // 1. Ensure default Super Admin account exists
    const userCount = await prisma.user.count().catch(() => -1)
    if (userCount === 0) {
      console.log('[AIVA Bootstrap] No users found. Initializing Super Admin user (itsupport)...')
      await prisma.user.create({
        data: {
          id: 'itsupport',
          email: 'itsupport@aapico.com',
          name: 'IT Support (AH)',
          role: 'SA',
          companies: {
            create: [{ companyCode: 'ALL' }],
          },
        },
      }).catch(err => console.warn('[AIVA Bootstrap] Could not seed user:', err.message))
    }

    // 2. Ensure sample invoices from paperless_invoices_v5 are populated
    const docCount = await prisma.document.count().catch(() => -1)
    if (docCount > 0) {
      return // Already populated
    }

    // Locate sample directory
    const candidates = [
      path.resolve(process.cwd(), 'temp/paperless_invoices_v5'),
      path.resolve(process.cwd(), '.next/standalone/temp/paperless_invoices_v5'),
      '/app/temp/paperless_invoices_v5',
    ]

    const targetDir = candidates.find(c => fs.existsSync(c))
    if (!targetDir) {
      console.warn('[AIVA Bootstrap] Sample dataset directory temp/paperless_invoices_v5 not found.')
      return
    }

    const files = fs.readdirSync(targetDir).filter(f => f.startsWith('DMS-') && f.endsWith('_result.json'))
    if (files.length === 0) {
      console.warn(`[AIVA Bootstrap] No result JSON files found in ${targetDir}`)
      return
    }

    console.log(`[AIVA Bootstrap] Found ${files.length} sample invoices in ${targetDir}. Ingesting into database...`)

    let ingested = 0
    for (const file of files) {
      try {
        const fullPath = path.join(targetDir, file)
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
        const doc = transformEngineResultToPortalDoc(raw)

        const receiptNum = doc.receiptNums?.[0] ?? null
        const docData = {
          dmsDocId: doc.dmsDocId,
          packageId: doc.packageId,
          fileSha256: doc.fileSha256,
          pageCount: doc.pageCount,
          invoiceNum: doc.invoiceNum,
          invoiceDate: doc.invoiceDate,
          companyCode: doc.companyCode,
          supplierTaxId: doc.supplierTaxId,
          supplierName: doc.supplierName,
          grandTotal: doc.grandTotal,
          currency: doc.currency,
          status: doc.status,
          recommendation: doc.recommendation,
          maxSeverity: doc.maxSeverity,
          receiverName: doc.receiverName ?? null,
          receiptNum,
          linesMatched: doc.linesMatched ?? null,
          assignedRole: doc.assignedRole,
          apStatus: doc.apStatus,
          payloadJson: JSON.stringify(doc),
        }

        await prisma.document.upsert({
          where: { id: doc.id },
          create: { id: doc.id, ...docData },
          update: docData,
        })
        ingested++
      } catch (err: any) {
        console.warn(`[AIVA Bootstrap] Skipping invalid file ${file}:`, err?.message)
      }
    }

    console.log(`[AIVA Bootstrap] Successfully ingested ${ingested} invoices from paperless_invoices_v5 into database.`)
  } catch (err: any) {
    console.warn('[AIVA Bootstrap] Auto-seed error:', err?.message)
  }
}
