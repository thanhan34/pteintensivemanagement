'use client';

import { useState } from 'react';
import { Task, Project, Label, TaskStatus } from '../types/task';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  projects: Project[];
  labels: Label[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onComplete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskCard({ 
  task, 
  projects, 
  labels, 
  onStatusChange, 
  onComplete,
  onEdit,
  onDelete 
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);

  const project = projects.find(p => p.id === task.projectId);
  const taskLabels = labels.filter(l => task.labels.includes(l.id));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const isOverdue = task.status !== 'done' && isPast(task.dueDate);

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(task.id, newStatus as TaskStatus);
  };

  const handleComplete = () => {
    if (task.status !== 'done') {
      onComplete(task.id);
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      task.status === 'done' && "opacity-75",
      isOverdue && "border-red-200 bg-red-50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Status Checkbox */}
            <div className="mt-1">
              <Checkbox
                checked={task.status === 'done'}
                onCheckedChange={handleComplete}
                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
            </div>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={cn(
                  "font-semibold text-foreground",
                  task.status === 'done' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h3>
                
                {/* Priority Indicator */}
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getPriorityColor(task.priority)
                )} />
              </div>

              {task.description && (
                <p className={cn(
                  "text-sm text-muted-foreground mb-3",
                  task.status === 'done' && "line-through"
                )}>
                  {task.description}
                </p>
              )}

              {/* Task Meta Information */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Due Date */}
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue ? "text-red-600" : "text-muted-foreground"
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>{formatDueDate(task.dueDate)}</span>
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                </div>

                {/* Project */}
                {project && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <span>{project.name}</span>
                  </div>
                )}

                {/* Priority */}
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getPriorityTextColor(task.priority))}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>

                {/* Status */}
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getStatusColor(task.status))}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(task.status)}
                    {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
                  </div>
                </Badge>
              </div>

              {/* Labels */}
              {taskLabels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {taskLabels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="text-xs"
                      style={{ 
                        backgroundColor: label.color + '20', 
                        color: label.color,
                        borderColor: label.color + '40'
                      }}
                    >
                      <Tag className="h-2 w-2 mr-1" />
                      {label.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Status Selector */}
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-auto h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-gray-400" />
                    To Do
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-500" />
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="done">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Done
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* More Actions */}
            {(onEdit || onDelete) && (
              <Popover open={showActions} onOpenChange={setShowActions}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="end">
                  <div className="space-y-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8"
                        onClick={() => {
                          onEdit(task);
                          setShowActions(false);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          onDelete(task.id);
                          setShowActions(false);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
