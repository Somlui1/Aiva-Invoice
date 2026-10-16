import { describe, it, expect } from 'vitest'
import { engineResultV3Schema } from '../features/engine/schemas/engineResultV3Schema'
import fs from 'node:fs'
import path from 'node:path'

describe('Engine Result 3.0 Schema Validator', () => {
  it('validates DMS-100 engine result successfully', () => {
    const filePath = path.resolve(process.cwd(), 'temp/run_20261011/DMS-100_result.json')
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const parsed = engineResultV3Schema.safeParse(rawData)
    expect(parsed.success).toBe(true)
  })
})
