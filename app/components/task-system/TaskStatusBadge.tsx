'use client';

import { Badge } from '@/components/ui/badge';
import { TaskPriority, TaskStatus } from '@/app/types/task-system';
import { cn } from '@/lib/utils';

const statusClasses: Record<TaskStatus, string> = {
  new: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  waiting_review: 'bg-blue-100 text-blue-700 border-blue-200',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

const priorityClasses: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  high: 'bg-orange-200 text-orange-800 border-orange-300',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={cn('border', statusClasses[status])}>{status.replace('_', ' ')}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={cn('border', priorityClasses[priority])}>{priority}</Badge>;
}
