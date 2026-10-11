import { describe, it, expect } from 'vitest'
import { transformEngineResultToPortalDoc } from '../features/engine/adapters/engineToPortalAdapter'
import fs from 'node:fs'
import path from 'node:path'

describe('EngineToPortalAdapter', () => {
  it('correctly transforms DMS-100 engine result into Portal Domain Document', () => {
    const raw = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'temp/paperless_invoices_v5/DMS-100_result.json'), 'utf-8'))
    const doc = transformEngineResultToPortalDoc(raw)
    
    expect(doc.id).toBe('DMS-100')
    expect(doc.invoiceNum).toBe('694055679')
    expect(doc.companyCode).toBe('AHT')
    expect(doc.grandTotal).toBe(34989.00)
    expect(doc.status).toBe('Manual Review')
    expect(doc.stepProgress.step3.status).toBe('warn')
    expect(doc.bboxes.length).toBeGreaterThan(0)
    expect(doc.bboxes[0].bbox).toHaveLength(4)
  })
})
