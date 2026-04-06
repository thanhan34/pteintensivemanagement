'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader from '@/app/components/task-system/TaskPageHeader';
import TaskForm from '@/app/components/task-system/TaskForm';
import { useTaskDetail, useTaskUsers } from '@/app/hooks/use-task-system';
import { taskSystemService } from '@/app/services/task-system.service';

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { users } = useTaskUsers();
  const { task, permissions, loading } = useTaskDetail(params.id);

  if (loading) {
    return <TaskShell><div className="text-sm text-slate-500">Loading task...</div></TaskShell>;
  }

  if (!task || !permissions.canEditContent) {
    return <TaskShell><div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600 shadow-sm">You do not have permission to edit this task.</div></TaskShell>;
  }

  return (
    <TaskShell>
      <TaskPageHeader title={`Edit ${task.code}`} description="Update task content, deadline, assignees, watchers, and attachments." />
      <TaskForm
        users={users}
        initialTask={task}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          if (!session?.user?.id) return;
          await taskSystemService.updateTaskContent(task.id, values, { id: session.user.id, name: session.user.name });
          router.push(`/tasks/${task.id}`);
        }}
      />
    </TaskShell>
  );
}
