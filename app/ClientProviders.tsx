'use client';

import { SessionProvider } from 'next-auth/react';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refresh session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
