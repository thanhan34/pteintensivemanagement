import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientProviders from './ClientProviders';
import Navigation from '@/src/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PTE Intensive Management',
  description: 'Attendance management system for PTE trainers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
