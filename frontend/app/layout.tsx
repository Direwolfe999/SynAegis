import './globals.css'
import type { Metadata } from 'next'

import ProductionGuard from '../components/ProductionGuard'

export const viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'SynAegis | Autonomous DevOps Engine',
  description: 'AI-driven operations and orchestration platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/logos/favicon.png',
    shortcut: '/logos/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    title: 'SynAegis',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased font-sans text-slate-800 bg-white dark:text-slate-100 dark:bg-[#050505] transition-colors duration-500" suppressHydrationWarning>
        {/* Empty div wrapper blocks extensions from replacing our script tag by mistake */}
        <div suppressHydrationWarning>
          <script dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `
          }} />
        </div>

        <div id="splash-screen" suppressHydrationWarning>
          <img src="/logos/logo.png" alt="logo" />
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            function removeSplash() {
              const splash = document.getElementById("splash-screen");
              if (splash) {
                splash.classList.add("fade-out");
                setTimeout(() => {
                  try { splash.remove(); } catch(e) {}
                }, 500);
              }
            }
            if (document.readyState === 'complete') {
              removeSplash();
            } else {
              window.addEventListener('load', removeSplash);
              // Fallback just in case load is blocked
              setTimeout(removeSplash, 2000); 
            }
          `
        }} />

        <ProductionGuard />
        {children}
      </body>
    </html>
  )
}
