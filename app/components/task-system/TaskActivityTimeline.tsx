'use client';

import { formatDistanceToNow } from 'date-fns';
import { TaskActivity } from '@/app/types/task-system';
import { useHydrated } from '@/app/hooks/use-hydrated';

export default function TaskActivityTimeline({ activities }: { activities: TaskActivity[] }) {
  const hydrated = useHydrated();

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Activity log</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="relative border-l-2 border-orange-200 pl-4">
            <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[#fc5d01]" />
            <div className="text-sm font-medium text-slate-900">{activity.actorName || 'System'}</div>
            <div className="text-sm text-slate-600">{activity.message}</div>
            <div className="mt-1 text-xs text-slate-500">
              {hydrated
                ? formatDistanceToNow(activity.createdAt, { addSuffix: true })
                : activity.createdAt.toLocaleString('en-GB')}
            </div>
          </div>
        ))}
        {!activities.length && <div className="rounded-xl border border-dashed border-orange-200 p-6 text-center text-sm text-slate-500">No activity yet.</div>}
      </div>
    </div>
  );
}
