import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VA collective',
  description: 'Comprehensive creator booking and campaign management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationsProvider>
            <div className="min-h-screen bg-background font-sans antialiased">
              {children}
            </div>
            <Toaster richColors position="top-right" />
          </NotificationsProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
