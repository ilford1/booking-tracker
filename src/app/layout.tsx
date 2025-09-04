import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KOL Booking Tracker',
  description: 'Comprehensive KOL/KOC booking and campaign management system',
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
          <div className="min-h-screen bg-background font-sans antialiased">
            {children}
          </div>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
