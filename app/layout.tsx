import './globals.css'
import { Inter } from 'next/font/google'
import ClientProviders from './ClientProviders'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PTE Intensive Management',
  description: 'Management system for PTE Intensive',
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
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  )
}
