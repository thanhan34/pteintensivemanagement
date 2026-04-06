import { UserRole } from '@/app/types/roles';
import {
  TaskPermissionSet,
  TaskRecord,
  TaskStats,
  TaskStatus,
  TaskUserProfile,
  TicketSystemRole,
} from '@/app/types/task-system';

export const ADMIN_ROLES: UserRole[] = ['admin'];

export function mapToTicketRole(role?: string | null): TicketSystemRole {
  return role === 'admin' ? 'admin' : 'member';
}

export function isTaskAdmin(role?: string | null): boolean {
  return mapToTicketRole(role) === 'admin';
}

export function isTaskRelated(task: TaskRecord, userId?: string | null): boolean {
  if (!userId) return false;
  return (
    task.createdBy === userId ||
    task.assigneeIds.includes(userId) ||
    task.watcherIds.includes(userId)
  );
}

export function getTaskPermissions(
  task: TaskRecord | null | undefined,
  userId?: string | null,
  role?: string | null,
): TaskPermissionSet {
  const admin = isTaskAdmin(role);
  const isCreator = !!task && !!userId && task.createdBy === userId;
  const isAssignee = !!task && !!userId && task.assigneeIds.includes(userId);
  const isRelated = !!task && !!userId && isTaskRelated(task, userId);

  return {
    canView: admin || isRelated,
    canEditContent: admin || isCreator,
    canUpdateStatus: admin || isAssignee,
    canComment: admin || isRelated,
    canDelete: admin,
    canManageUsers: admin,
  };
}

export function filterVisibleTasks(tasks: TaskRecord[], userId?: string | null, role?: string | null) {
  if (isTaskAdmin(role)) return tasks;
  return tasks.filter((task) => isTaskRelated(task, userId));
}

export function getTaskStats(tasks: TaskRecord[], userId?: string | null): TaskStats {
  const now = new Date();
  const isSameDay = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === now.toDateString();
  };

  return {
    total: tasks.length,
    assignedToMe: tasks.filter((task) => !!userId && task.assigneeIds.includes(userId)).length,
    createdByMe: tasks.filter((task) => !!userId && task.createdBy === userId).length,
    watching: tasks.filter((task) => !!userId && task.watcherIds.includes(userId)).length,
    overdue: tasks.filter((task) => task.dueDate && task.status !== 'done' && task.status !== 'cancelled' && task.dueDate < now).length,
    waitingReview: tasks.filter((task) => task.status === 'waiting_review').length,
    done: tasks.filter((task) => task.status === 'done' || isSameDay(task.dueDate)).filter((task) => task.status === 'done').length,
  };
}

export function getDisplayName(userId: string, users: TaskUserProfile[]) {
  const user = users.find((item) => item.id === userId);
  return user?.name || user?.email || 'Unknown user';
}

export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_review', label: 'Waiting Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;
