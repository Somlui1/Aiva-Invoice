import { NextResponse } from 'next/server'

export async function GET() {
  const backendUrl = process.env.SYSTEM_A_URL || 'http://127.0.0.1:8080'
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    
    const res = await fetch(`${backendUrl}/health/ready`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({
        ok: true,
        mode: 'live',
        service: 'System A Core Invoice Matching Engine',
        engineUrl: backendUrl,
        ruleset: data.ruleset || 'v6.6-r4',
        standard: data.standard || '6.6',
        details: data,
        timestamp: new Date().toISOString()
      })
    }
  } catch {
    // Engine offline or unreachable
  }

  // Graceful fallback to built-in Sandbox mode
  return NextResponse.json({
    ok: true,
    mode: 'sandbox',
    service: 'System A Sandbox & Local Simulator',
    engineUrl: backendUrl,
    ruleset: 'v6.6',
    standard: '6.6',
    note: 'Running in Next.js internal sandbox mode (System A backend offline)',
    timestamp: new Date().toISOString()
  })
}
