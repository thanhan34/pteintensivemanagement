'use client';

import { Task, Project, Label, TaskStatus } from '../types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  Calendar,
  AlertTriangle,
  Pencil,
  Trash2
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  projects: Project[];
  labels: Label[];
  users?: Array<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
  }>;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onComplete: (taskId: string) => void;
  canManage?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export default function TaskCard({
  task,
  projects,
  labels,
  users = [],
  onStatusChange,
  onComplete,
  canManage = false,
  onEdit,
  onDelete
}: TaskCardProps) {
  const project = projects.find(p => p.id === task.projectId);
  const taskLabels = labels.filter(l => task.labels.includes(l.id));
  const assignedNames = task.assignedTo.map((assignee) => {
    const matchedUser = users.find(
      (u) => u.id === assignee || (u.email && u.email === assignee)
    );

    if (matchedUser) {
      return matchedUser.name || matchedUser.email || assignee;
    }

    return assignee;
  });
  const isOverdue = task.status !== 'done' && isPast(task.dueDate);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleStatusClick = () => {
    if (task.status === 'todo') {
      onStatusChange(task.id, 'in_progress');
    } else if (task.status === 'in_progress') {
      onComplete(task.id);
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        task.status === 'done' && "opacity-75",
        isOverdue && "border-red-200 bg-red-50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleStatusClick}
              >
                {getStatusIcon()}
              </Button>
              
              <div className="flex-1">
                <h3 className={cn(
                  "font-medium text-sm",
                  task.status === 'done' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h3>
              </div>
              
              {/* Priority indicator */}
              <div className={cn(
                "w-2 h-2 rounded-full",
                getPriorityColor(task.priority)
              )} />
            </div>

            {/* Description */}
            {task.description && (
              <p className={cn(
                "text-sm text-muted-foreground pl-9",
                task.status === 'done' && "line-through"
              )}>
                {task.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pl-9">
              {/* Due date */}
              <div className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-600"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDueDate(task.dueDate)}</span>
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
              </div>

              {/* Project */}
              {project && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span>{project.name}</span>
                </div>
              )}

              {/* Assigned to */}
              {task.assignedTo.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>{assignedNames.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Labels */}
            {taskLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 pl-9">
                {taskLabels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="secondary"
                    className="text-xs px-2 py-0 h-5"
                    style={{ 
                      backgroundColor: label.color + '20', 
                      color: label.color,
                      borderColor: label.color + '40'
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                task.status === 'done' && "bg-green-50 text-green-700 border-green-200",
                task.status === 'in_progress' && "bg-blue-50 text-blue-700 border-blue-200",
                task.status === 'todo' && "bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              {task.status === 'in_progress' ? 'In Progress' : 
               task.status === 'done' ? 'Completed' : 'To Do'}
            </Badge>
            
            {canManage && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onEdit?.(task)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                  onClick={() => onDelete?.(task)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
