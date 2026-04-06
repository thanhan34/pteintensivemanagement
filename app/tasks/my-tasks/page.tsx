'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader, { CreateTaskButton } from '@/app/components/task-system/TaskPageHeader';
import TaskFiltersBar from '@/app/components/task-system/TaskFiltersBar';
import TaskTable from '@/app/components/task-system/TaskTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskList, useTaskUsers } from '@/app/hooks/use-task-system';
import { TaskFilters } from '@/app/types/task-system';

export default function MyTasksPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<TaskFilters>({});
  const { users } = useTaskUsers();
  const { tasks, loading } = useTaskList(filters);

  const assigned = useMemo(() => tasks.filter((task) => task.assigneeIds.includes(session?.user?.id || '')), [session?.user?.id, tasks]);
  const watching = useMemo(() => tasks.filter((task) => task.watcherIds.includes(session?.user?.id || '')), [session?.user?.id, tasks]);

  return (
    <TaskShell>
      <TaskPageHeader
        title="My tasks"
        description="See the tickets assigned to you and the tasks you are following in realtime."
        action={<CreateTaskButton />}
      />

      <TaskFiltersBar filters={filters} onChange={setFilters} users={users} />

      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList className="bg-orange-100/60 text-slate-600">
          <TabsTrigger value="assigned">Assigned to me</TabsTrigger>
          <TabsTrigger value="watching">Watching</TabsTrigger>
        </TabsList>
        <TabsContent value="assigned">
          {loading ? <div className="text-sm text-slate-500">Loading tasks...</div> : <TaskTable tasks={assigned} users={users} showCreator />}
        </TabsContent>
        <TabsContent value="watching">
          {loading ? <div className="text-sm text-slate-500">Loading tasks...</div> : <TaskTable tasks={watching} users={users} showCreator />}
        </TabsContent>
      </Tabs>
    </TaskShell>
  );
}
