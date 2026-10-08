import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const schemaPath = path.resolve(process.cwd(), '../engine/schemas/result-3.0.schema.json')
  try {
    if (fs.existsSync(schemaPath)) {
      const data = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
      return NextResponse.json(data)
    }
  } catch (err) {
    console.error('Error reading schema file:', err)
  }

  // Fallback schema description
  return NextResponse.json({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'aiva.system_a.result/3.0',
    type: 'object',
    required: ['contract', 'request', 'versions', 'package', 'normalized_fields', 'recommendation'],
    properties: {
      contract: { const: 'aiva.system_a.result/3.0' },
      request: { type: 'object' },
      versions: { type: 'object' },
      package: { type: 'object' },
      normalized_fields: { type: 'object' },
      oracle_snapshot: { type: 'object' },
      line_matching: { type: 'object' },
      rule_results: { type: 'array' },
      recommendation: { type: 'object' }
    }
  })
}
