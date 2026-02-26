export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type RecurringPattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string;
  assignedTo: string[];
  projectId?: string;
  labels: string[];
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  reminderTime?: Date;
  completedAt?: Date;
  sourceRecurringTaskId?: string;
  recurrenceDateKey?: string;
  isTemplate?: boolean;
  taskCategory?: 'recurring_daily' | 'ad_hoc';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdBy: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface UserStats {
  userId: string;
  tasksCompleted: number;
  karmaPoints: number;
  weeklyStats: {
    week: string;
    tasksCompleted: number;
    karmaEarned: number;
  }[];
  monthlyStats: {
    month: string;
    tasksCompleted: number;
    karmaEarned: number;
  }[];
  lastUpdated: Date;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string[];
  viewerUserId?: string;
  viewerRole?: string;
  projectId?: string;
  labels?: string[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  overdue?: boolean;
  today?: boolean;
  next7days?: boolean;
  includeTemplates?: boolean;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

// Utility types for forms
export interface CreateTaskData {
  title: string;
  description: string;
  dueDate: Date;
  priority: TaskPriority;
  assignedTo: string[];
  projectId?: string;
  labels: string[];
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  reminderTime?: Date;
}

export interface CreateProjectData {
  name: string;
  description: string;
  color: string;
  members: string[];
}

export interface CreateLabelData {
  name: string;
  color: string;
}
