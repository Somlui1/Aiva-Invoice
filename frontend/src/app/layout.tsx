import type { Metadata, Viewport } from 'next'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/layout.css'
import '@/styles/components.css'
import '@/styles/queue.css'
import '@/styles/evidence.css'
import '@/styles/cf.css'
import '@/styles/pm.css'
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

        {/* Mockup v5.2 exact stylesheets with Dark/Light media switching */}
        <link rel="stylesheet" href="/styles/style-00.css" data-t="l" />
        <link rel="stylesheet" href="/styles/style-01.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-02.css" id="ivcss" />
        <link rel="stylesheet" href="/styles/style-03.css" data-t="l" />
        <link rel="stylesheet" href="/styles/style-04.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-05.css" id="simcss" data-t="l" />
        <link rel="stylesheet" href="/styles/style-06.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-07.css" id="setcss" data-t="l" />
        <link rel="stylesheet" href="/styles/style-08.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-09.css" id="lgcss" data-t="l" />
        <link rel="stylesheet" href="/styles/style-10.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-11.css" id="cfcss" data-t="l" />
        <link rel="stylesheet" href="/styles/style-12.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-13.css" id="pmcss" data-t="l" />
        <link rel="stylesheet" href="/styles/style-14.css" data-t="d" media="not all" />
        <link rel="stylesheet" href="/styles/style-15.css" id="aivacss" />
        <link rel="stylesheet" href="/styles/style-16.css" id="aivacss52" />

        <script
          dangerouslySetInnerHTML={{
            __html: `/* เลือกชุดสไตล์ก่อนวาดหน้าแรก (กันหน้ากะพริบ) */
(function(){
  var t="dark";
  try{t=localStorage.getItem("aiva.theme")||"dark"}catch(e){}
  if(t!=="light")t="dark";
  document.documentElement.setAttribute("data-theme",t);
  window.__aivaStyles=function(t){
    var k=t==="light"?"l":"d";
    var a=document.querySelectorAll("style[data-t],link[data-t]");
    for(var i=0;i<a.length;i++){
      a[i].media=a[i].getAttribute("data-t")===k?"all":"not all";
    }
  };
  window.__aivaStyles(t);
})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
