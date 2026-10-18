import type { Metadata, Viewport } from 'next'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/components.css'
import '@/styles/queue.css'
import '@/styles/evidence.css'
import '@/styles/cf.css'
import '@/styles/pm.css'
import '@/styles/permissionGrid.css'
import '@/styles/fx.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
  themeColor: '#0b0b0e',
}

export const metadata: Metadata = {
  title: 'AIVA · Auto Invoice Matching — v5.2 Dark / Light · SRS v1.1',
  description: 'AIVA — Auto Invoice Matching: OCR › Match › Post to Oracle · Dark/Light Premium UI (v5.2)',
  icons: {
    icon: '/favicon.ico',
  },
}

import { ThemeProvider } from '@/context/ThemeContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300..800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `/* เลือกชุดสไตล์ก่อนวาดหน้าแรก (กันหน้ากะพริบ) */
(function(){
  try {
    var t = localStorage.getItem("aiva.theme") || "dark";
    if (t !== "light") t = "dark";
    document.documentElement.setAttribute("data-theme", t);
  } catch(e) {}
})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
