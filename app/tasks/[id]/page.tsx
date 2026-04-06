'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader from '@/app/components/task-system/TaskPageHeader';
import TaskComments from '@/app/components/task-system/TaskComments';
import TaskActivityTimeline from '@/app/components/task-system/TaskActivityTimeline';
import { TaskPriorityBadge, TaskStatusBadge } from '@/app/components/task-system/TaskStatusBadge';
import { useTaskDetail, useTaskUsers } from '@/app/hooks/use-task-system';
import { getDisplayName, TASK_STATUS_OPTIONS } from '@/app/utils/task-system-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { taskSystemService } from '@/app/services/task-system.service';

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { users } = useTaskUsers();
  const { task, comments, activities, permissions, loading } = useTaskDetail(params.id);

  if (loading) {
    return <TaskShell><div className="text-sm text-slate-500">Loading task...</div></TaskShell>;
  }

  if (!task || !permissions.canView) {
    return <TaskShell><div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600 shadow-sm">You do not have permission to view this task.</div></TaskShell>;
  }

  return (
    <TaskShell>
      <TaskPageHeader
        title={task.title}
        description={`Ticket ${task.code} • created by ${getDisplayName(task.createdBy, users)}`}
        action={
          <div className="flex gap-2">
            {permissions.canEditContent && (
              <Button asChild variant="outline" className="border-orange-200 text-[#fc5d01] hover:bg-orange-50">
                <Link href={`/tasks/${task.id}/edit`}>Edit task</Link>
              </Button>
            )}
            {permissions.canDelete && (
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  if (!session?.user?.id) return;
                  if (!window.confirm('Delete this task?')) return;
                  await taskSystemService.deleteTask(task.id, { id: session.user.id, name: session.user.name });
                  router.push('/tasks');
                }}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <div className="space-y-6">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle>Task details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">Description</div>
                <div className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description || 'No description provided.'}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Assignees</div>
                  <div className="mt-2 text-sm text-slate-600">{task.assigneeIds.length ? task.assigneeIds.map((id) => getDisplayName(id, users)).join(', ') : 'No assignees'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Watchers</div>
                  <div className="mt-2 text-sm text-slate-600">{task.watcherIds.length ? task.watcherIds.map((id) => getDisplayName(id, users)).join(', ') : 'No watchers'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Due date</div>
                  <div className="mt-2 text-sm text-slate-600">{task.dueDate ? format(task.dueDate, 'dd/MM/yyyy') : 'No deadline'}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Updated</div>
                  <div className="mt-2 text-sm text-slate-600">{format(task.updatedAt, 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-800">Attachments</div>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <a key={attachment.id} href={attachment.url} target="_blank" className="block rounded-xl border border-orange-100 px-4 py-3 text-sm text-[#fc5d01] hover:bg-orange-50" rel="noreferrer">
                      {attachment.name}
                    </a>
                  ))}
                  {!task.attachments.length && <div className="text-sm text-slate-500">No attachments uploaded.</div>}
                </div>
              </div>
            </CardContent>
          </Card>

          <TaskComments
            comments={comments}
            canComment={permissions.canComment}
            onSubmit={async (content) => {
              if (!session?.user?.id) return;
              await taskSystemService.addComment(task.id, content, { id: session.user.id, name: session.user.name });
            }}
          />
        </div>

        <div className="space-y-6">
          {permissions.canUpdateStatus && (
            <Card className="border-orange-100 shadow-sm">
              <CardHeader>
                <CardTitle>Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={task.status}
                  onValueChange={async (value) => {
                    if (!session?.user?.id) return;
                    await taskSystemService.updateTaskStatus(task.id, value as typeof task.status, { id: session.user.id, name: session.user.name });
                  }}
                >
                  <SelectTrigger className="border-orange-100"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <TaskActivityTimeline activities={activities} />
        </div>
      </div>
    </TaskShell>
  );
}
