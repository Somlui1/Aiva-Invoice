import { NextRequest, NextResponse } from 'next/server'
import { getValidation, saveValidation, generateSandboxResult } from '@/lib/validationStore'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const backendUrl = process.env.SYSTEM_A_URL || 'http://127.0.0.1:8080'
  let body: any = {}
  try {
    body = await req.json()
  } catch {}

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${backendUrl}/v1/validations/${id}/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok || res.status === 202) {
      return NextResponse.json(await res.json(), { status: res.status })
    }
  } catch {
    // Engine offline
  }

  const stored = getValidation(id)
  const newRound = (body.validation_round || 1) + 1
  const newId = `${id}-R${newRound}`
  const result = generateSandboxResult(newId, stored?.request?.extraction, newRound)

  saveValidation({
    id: newId,
    status: 'completed',
    request: stored?.request,
    result,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  return NextResponse.json(
    {
      validation_id: newId,
      status: 'completed',
      idempotent_replay: false,
      mode: 'sandbox',
      result
    },
    { status: 202 }
  )
}
