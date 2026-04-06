'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStats } from '@/app/types/task-system';

export default function TaskStatsCards({ stats }: { stats: TaskStats }) {
  const items = [
    { label: 'Total visible', value: stats.total },
    { label: 'Assigned to me', value: stats.assignedToMe },
    { label: 'Created by me', value: stats.createdByMe },
    { label: 'Watching', value: stats.watching },
    { label: 'Overdue', value: stats.overdue },
    { label: 'Waiting review', value: stats.waitingReview },
    { label: 'Done', value: stats.done },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-orange-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
