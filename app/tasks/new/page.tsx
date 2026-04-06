'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader from '@/app/components/task-system/TaskPageHeader';
import TaskForm from '@/app/components/task-system/TaskForm';
import { useTaskUsers } from '@/app/hooks/use-task-system';
import { taskSystemService } from '@/app/services/task-system.service';

export default function CreateTaskPage() {
  const { data: session } = useSession();
  const { users } = useTaskUsers();
  const router = useRouter();

  return (
    <TaskShell>
      <TaskPageHeader title="Create task" description="Create a new ticket, assign teammates, and keep relevant users watching the task." />
      <TaskForm
        users={users}
        submitLabel="Create task"
        onSubmit={async (values) => {
          if (!session?.user?.id) return;
          const taskId = await taskSystemService.createTask(values, { id: session.user.id, name: session.user.name });
          router.push(`/tasks/${taskId}`);
        }}
      />
    </TaskShell>
  );
}
