import { NextRequest, NextResponse } from 'next/server'
import { getValidation } from '@/lib/validationStore'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const backendUrl = process.env.SYSTEM_A_URL || 'http://127.0.0.1:8080'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const res = await fetch(`${backendUrl}/v1/validations/${id}/result`, {
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      return NextResponse.json(await res.json())
    }
  } catch {
    // Engine not answering
  }

  const stored = getValidation(id)
  if (!stored) {
    return NextResponse.json({ error: 'Validation not found' }, { status: 404 })
  }

  if (stored.status !== 'completed' || !stored.result) {
    return NextResponse.json({ error: `Validation status is ${stored.status}` }, { status: 409 })
  }

  return NextResponse.json(stored.result)
}
