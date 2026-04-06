'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { TaskRecord, TaskUserProfile } from '@/app/types/task-system';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getDisplayName } from '@/app/utils/task-system-permissions';
import { TaskPriorityBadge, TaskStatusBadge } from '@/app/components/task-system/TaskStatusBadge';

export default function TaskTable({
  tasks,
  users,
  showCreator = true,
}: {
  tasks: TaskRecord[];
  users: TaskUserProfile[];
  showCreator?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignees</TableHead>
            {showCreator && <TableHead>Created by</TableHead>}
            <TableHead>Due date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-semibold text-[#fc5d01]">{task.code}</TableCell>
              <TableCell>
                <div className="font-medium text-slate-900">{task.title}</div>
                <div className="line-clamp-1 text-xs text-slate-500">{task.description}</div>
              </TableCell>
              <TableCell><TaskStatusBadge status={task.status} /></TableCell>
              <TableCell><TaskPriorityBadge priority={task.priority} /></TableCell>
              <TableCell className="text-sm text-slate-600">
                {task.assigneeIds.length ? task.assigneeIds.map((id) => getDisplayName(id, users)).join(', ') : 'Unassigned'}
              </TableCell>
              {showCreator && <TableCell className="text-sm text-slate-600">{getDisplayName(task.createdBy, users)}</TableCell>}
              <TableCell className="text-sm text-slate-600">{task.dueDate ? format(task.dueDate, 'dd/MM/yyyy') : 'No deadline'}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" className="border-orange-200 text-[#fc5d01] hover:bg-orange-50">
                  <Link href={`/tasks/${task.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!tasks.length && (
            <TableRow>
              <TableCell colSpan={showCreator ? 8 : 7} className="py-10 text-center text-slate-500">
                No tasks found for the selected filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
