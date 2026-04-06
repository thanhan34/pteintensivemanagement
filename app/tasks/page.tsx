'use client';

import Link from 'next/link';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader, { CreateTaskButton } from '@/app/components/task-system/TaskPageHeader';
import TaskStatsCards from '@/app/components/task-system/TaskStatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTaskList, useTaskUsers } from '@/app/hooks/use-task-system';

export default function TasksDashboardPage() {
  const { tasks, stats, loading } = useTaskList();
  const { users } = useTaskUsers();

  const recentTasks = tasks.slice(0, 5);
  const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < new Date() && !['done', 'cancelled'].includes(task.status)).slice(0, 5);

  return (
    <TaskShell>
      <TaskPageHeader
        title="Task dashboard"
        description="Track tickets, monitor deadlines, and jump into your most important work with realtime updates."
        action={<CreateTaskButton />}
      />

      <TaskStatsCards stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent tasks</CardTitle>
            </div>
            <Button asChild variant="outline" className="border-orange-200 text-[#fc5d01] hover:bg-orange-50">
              <Link href="/tasks/my-tasks">Open my tasks</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <div className="text-sm text-slate-500">Loading dashboard...</div>}
            {!loading && recentTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-xl border border-orange-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#fc5d01]">{task.code}</div>
                    <div className="font-medium text-slate-900">{task.title}</div>
                  </div>
                  <div className="text-xs text-slate-500">{task.assigneeIds.length} assignee(s)</div>
                </div>
              </Link>
            ))}
            {!loading && !recentTasks.length && <div className="rounded-xl border border-dashed border-orange-200 p-6 text-center text-sm text-slate-500">No tasks yet.</div>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Overdue focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueTasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-xl border border-red-100 bg-red-50/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-red-600">{task.code}</div>
                  <div className="font-medium text-slate-900">{task.title}</div>
                </Link>
              ))}
              {!overdueTasks.length && <div className="rounded-xl border border-dashed border-orange-200 p-6 text-center text-sm text-slate-500">Nothing overdue. Great job.</div>}
            </CardContent>
          </Card>

          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Team visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">{users.length} users available for assignment and watch lists.</div>
              <div className="mt-3 text-sm text-slate-600">Use the dashboard shortcuts to navigate between <span className="font-semibold text-slate-900">My Tasks</span>, <span className="font-semibold text-slate-900">Created by Me</span>, and admin views.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TaskShell>
  );
}
