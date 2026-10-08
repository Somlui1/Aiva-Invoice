import { NextRequest, NextResponse } from 'next/server'
import { saveValidation, generateSandboxResult, listValidations } from '@/lib/validationStore'

export async function GET() {
  return NextResponse.json({
    validations: listValidations()
  })
}

export async function POST(req: NextRequest) {
  const backendUrl = process.env.SYSTEM_A_URL || 'http://127.0.0.1:8080'
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Attempt proxy to live System A engine
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const backendRes = await fetch(`${backendUrl}/v1/validations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.get('x-api-key') ? { 'x-api-key': req.headers.get('x-api-key')! } : {})
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (backendRes.ok || backendRes.status === 202) {
      const data = await backendRes.json()
      return NextResponse.json(data, { status: backendRes.status })
    }
  } catch {
    // Engine unreachable - fallback to sandbox
  }

  // Sandbox fallback
  const vid = `VAL-${Date.now()}`
  const result = generateSandboxResult(vid, body?.extraction, body?.portal_refs?.validation_round || 1)
  
  saveValidation({
    id: vid,
    status: 'completed',
    request: body,
    result,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  return NextResponse.json(
    {
      validation_id: vid,
      status: 'completed',
      idempotent_replay: false,
      mode: 'sandbox',
      result
    },
    { status: 202 }
  )
}
