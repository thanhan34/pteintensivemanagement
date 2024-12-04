import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientProviders from './ClientProviders'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PTE Intensive Management',
  description: 'Student management system for PTE Intensive courses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <Navigation/>
          {/* <nav className="bg-[#fc5d01]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-white text-xl font-bold">PTE Intensive Management</h1>
                  </div>
                </div>
              </div>
            </div>
          </nav> */}
          <main>{children}</main>
        </ClientProviders>
      </body>
    </html>
  )
}
