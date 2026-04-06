export type TicketSystemRole = 'admin' | 'member';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'new' | 'in_progress' | 'waiting_review' | 'done' | 'cancelled';

export type TaskActivityType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'commented'
  | 'assigned'
  | 'watcher_updated'
  | 'attachment_added'
  | 'deleted';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  path: string;
  size: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  createdBy: string;
  assigneeIds: string[];
  watcherIds: string[];
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  attachments: TaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  type: TaskActivityType;
  actorId: string;
  actorName?: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface TaskUserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  ticketRole: TicketSystemRole;
  isActive: boolean;
  image?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  lastLoginAt?: Date | null;
}

export interface TaskFormValues {
  title: string;
  description: string;
  assigneeIds: string[];
  watcherIds: string[];
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  attachments?: File[];
}

export interface TaskFilters {
  keyword?: string;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  assigneeId?: string | 'all';
  creatorId?: string | 'all';
  watcherId?: string | 'all';
  due?: 'all' | 'overdue' | 'today' | 'upcoming';
}

export interface TaskStats {
  total: number;
  assignedToMe: number;
  createdByMe: number;
  watching: number;
  overdue: number;
  waitingReview: number;
  done: number;
}

export interface TaskPermissionSet {
  canView: boolean;
  canEditContent: boolean;
  canUpdateStatus: boolean;
  canComment: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}
