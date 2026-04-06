'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export default function TaskPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fc5d01]">
          Task management system
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex items-center gap-3">{action}</div>
    </div>
  );
}

export function CreateTaskButton() {
  return (
    <Button asChild className="bg-[#fc5d01] text-white hover:bg-[#e55300]">
      <Link href="/tasks/new">Create task</Link>
    </Button>
  );
}
