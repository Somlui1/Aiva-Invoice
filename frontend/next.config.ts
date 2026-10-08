import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  // Support proxies to System A backend if SYSTEM_A_URL is defined
  async rewrites() {
    const backendUrl = process.env.SYSTEM_A_URL || 'http://127.0.0.1:8080'
    const portalUrl = process.env.TEST_PORTAL_URL || 'http://127.0.0.1:8090'
    return [
      {
        source: '/backend-api/system_a/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/backend-api/portal/:path*',
        destination: `${portalUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
