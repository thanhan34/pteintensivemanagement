'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import { ReactNode } from 'react';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  const isRegisterPage = pathname === '/register';

  if (isRegisterPage) {
    return null;
  }

  return <Navigation />;
}

export function ConditionalMainContainer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRegisterPage = pathname === '/register';

  if (isRegisterPage) {
    return <>{children}</>;
  }

  return <main className="container mx-auto px-4 py-8">{children}</main>;
}
