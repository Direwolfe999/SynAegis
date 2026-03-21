import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SynAegis | Autonomous DevOps War Room',
  description: 'AI-driven operations and orchestration platform',
  icons: {
    icon: '/logos/favicon.png',
    shortcut: '/logos/favicon.png',
    apple: '/logos/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans text-slate-800 bg-white dark:text-slate-100 dark:bg-[#050505] transition-colors duration-500">
        {children}
      </body>
    </html>
  )
}
