import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clientId = process.env.AZURE_AD_CLIENT_ID
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
  const tenantId = process.env.AZURE_AD_TENANT_ID

  // If Azure AD / Microsoft 365 is not yet configured, redirect back to login with notice
  if (!clientId || !clientSecret || !tenantId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('error', 'timeout')
    return NextResponse.redirect(loginUrl)
  }

  // If configured in the future, redirect to Microsoft OAuth authorization endpoint
  const redirectUri = encodeURIComponent(
    process.env.AZURE_AD_REDIRECT_URI || `${req.nextUrl.origin}/api/auth/microsoft/callback`
  )
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=openid%20profile%20email%20User.Read`

  return NextResponse.redirect(authUrl)
}
