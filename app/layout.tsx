import './globals.css'
import { Inter } from 'next/font/google'
import ClientProviders from './ClientProviders'
import ConditionalNavigation from './components/ConditionalNavigation'
import PWAInstaller from './components/PWAInstaller'
import OnlineStatus from './components/OnlineStatus'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PTE Intensive Management',
  description: 'Management system for PTE Intensive',
  manifest: '/manifest.json',
  themeColor: '#fc5d01',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PTE Management',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#fff5ef] min-h-screen`}>
        <ClientProviders>
          <ConditionalNavigation />
          {children}
          <PWAInstaller />
          <OnlineStatus />
        </ClientProviders>
      </body>
    </html>
  )
}
