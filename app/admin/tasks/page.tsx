'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader, { CreateTaskButton } from '@/app/components/task-system/TaskPageHeader';
import TaskFiltersBar from '@/app/components/task-system/TaskFiltersBar';
import TaskTable from '@/app/components/task-system/TaskTable';
import { useTaskList, useTaskUsers } from '@/app/hooks/use-task-system';
import { TaskFilters } from '@/app/types/task-system';

export default function AdminAllTasksPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<TaskFilters>({});
  const { users } = useTaskUsers();
  const { tasks, loading } = useTaskList(filters);

  if (session?.user?.role !== 'admin') {
    return <TaskShell><div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600 shadow-sm">Admin access required.</div></TaskShell>;
  }

  return (
    <TaskShell>
      <TaskPageHeader title="Admin all tasks" description="Full system-wide visibility across all tasks, assignees, watchers, and deadlines." action={<CreateTaskButton />} />
      <TaskFiltersBar filters={filters} onChange={setFilters} users={users} />
      {loading ? <div className="text-sm text-slate-500">Loading tasks...</div> : <TaskTable tasks={tasks} users={users} showCreator />}
    </TaskShell>
  );
}
