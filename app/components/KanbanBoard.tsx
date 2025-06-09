'use client';

import { useState } from 'react';
import { Task, Project, Label, TaskStatus, KanbanColumn } from '../types/task';
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onComplete: (taskId: string) => void;
}

interface KanbanTaskCardProps {
  task: Task;
  projects: Project[];
  labels: Label[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onComplete: (taskId: string) => void;
}

function KanbanTaskCard({ task, projects, labels }: KanbanTaskCardProps) {
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

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = task.status !== 'done' && isPast(task.dueDate);

  return (
    <Card 
      className={cn(
        "mb-3 cursor-move transition-all duration-200 hover:shadow-md",
        task.status === 'done' && "opacity-75",
        isOverdue && "border-red-200 bg-red-50"
      )}
      draggable
      onDragStart={(e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h4 className={cn(
              "font-medium text-sm leading-tight",
              task.status === 'done' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0 mt-1",
              getPriorityColor(task.priority)
            )} />
          </div>

          {/* Description */}
          {task.description && (
            <p className={cn(
              "text-xs text-muted-foreground line-clamp-2",
              task.status === 'done' && "line-through"
            )}>
              {task.description}
            </p>
          )}

          {/* Due Date */}
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-red-600" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" />
            <span>{formatDueDate(task.dueDate)}</span>
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
          </div>

          {/* Project */}
          {project && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate">{project.name}</span>
            </div>
          )}

          {/* Labels */}
          {taskLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {taskLabels.slice(0, 3).map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs px-1 py-0 h-4"
                  style={{ 
                    backgroundColor: label.color + '20', 
                    color: label.color,
                    borderColor: label.color + '40'
                  }}
                >
                  {label.name}
                </Badge>
              ))}
              {taskLabels.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                  +{taskLabels.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard({ tasks, projects, labels, onStatusChange, onComplete }: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Define columns
  const columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: tasks.filter(task => task.status === 'todo')
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: tasks.filter(task => task.status === 'in_progress')
    },
    {
      id: 'done',
      title: 'Done',
      tasks: tasks.filter(task => task.status === 'done')
    }
  ];

  const getColumnIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getColumnColor = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'border-green-200 bg-green-50';
      case 'in_progress': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId && taskId !== draggedTaskId) {
      onStatusChange(taskId, newStatus);
    }
    
    setDraggedTaskId(null);
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
      {columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            "flex flex-col rounded-lg border-2 border-dashed transition-colors",
            getColumnColor(column.id),
            draggedTaskId && "border-primary/50"
          )}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="p-4 border-b bg-background/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getColumnIcon(column.id)}
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {column.tasks.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  // TODO: Add quick task creation for this column
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Column Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {column.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground text-sm">
                    {column.id === 'todo' && 'No tasks to do'}
                    {column.id === 'in_progress' && 'No tasks in progress'}
                    {column.id === 'done' && 'No completed tasks'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag tasks here or create a new one
                  </p>
                </div>
              ) : (
                column.tasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    labels={labels}
                    onStatusChange={onStatusChange}
                    onComplete={onComplete}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}
