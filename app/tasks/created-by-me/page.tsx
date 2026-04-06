'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader, { CreateTaskButton } from '@/app/components/task-system/TaskPageHeader';
import TaskFiltersBar from '@/app/components/task-system/TaskFiltersBar';
import TaskTable from '@/app/components/task-system/TaskTable';
import { useTaskList, useTaskUsers } from '@/app/hooks/use-task-system';
import { TaskFilters } from '@/app/types/task-system';

export default function CreatedByMePage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<TaskFilters>({});
  const { users } = useTaskUsers();
  const { tasks, loading } = useTaskList(filters);

  const createdTasks = useMemo(() => tasks.filter((task) => task.createdBy === session?.user?.id), [session?.user?.id, tasks]);

  return (
    <TaskShell>
      <TaskPageHeader
        title="Created by me"
        description="Manage tasks you created, edit ticket content, and reassign work when priorities change."
        action={<CreateTaskButton />}
      />
      <TaskFiltersBar filters={filters} onChange={setFilters} users={users} />
      {loading ? <div className="text-sm text-slate-500">Loading tasks...</div> : <TaskTable tasks={createdTasks} users={users} showCreator={false} />}
    </TaskShell>
  );
}
