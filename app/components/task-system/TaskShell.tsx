'use client';

import { ReactNode } from 'react';
import { ConditionalMainContainer } from '@/app/components/ConditionalNavigation';

export default function TaskShell({ children }: { children: ReactNode }) {
  return (
    <ConditionalMainContainer>
      <div className="space-y-6">{children}</div>
    </ConditionalMainContainer>
  );
}
