'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Task, Project, Label, TaskFilter, TaskStatus } from '../types/task';
import { taskService, projectService } from '../utils/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Circle,
  LayoutGrid,
  List,
  Calendar
} from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import TaskForm from '../components/TaskForm';
import FilterPanel from '../components/FilterPanel';
import { cn } from '@/lib/utils';

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filter, setFilter] = useState<TaskFilter>({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tasksData, projectsData] = await Promise.all([
          taskService.getTasks(),
          projectService.getProjects()
        ]);
        
        setTasks(tasksData);
        setProjects(projectsData);
        
        // Mock labels for now - in real app, load from service
        setLabels([
          { id: '1', name: 'Bug', color: '#ef4444', createdBy: '', createdAt: new Date() },
          { id: '2', name: 'Feature', color: '#3b82f6', createdBy: '', createdAt: new Date() },
          { id: '3', name: 'Enhancement', color: '#10b981', createdBy: '', createdAt: new Date() },
          { id: '4', name: 'Documentation', color: '#f59e0b', createdBy: '', createdAt: new Date() },
          { id: '5', name: 'Testing', color: '#8b5cf6', createdBy: '', createdAt: new Date() }
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      loadData();
    }
  }, [session]);

  // Filter and search tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filter.status?.length && !filter.status.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (filter.priority?.length && !filter.priority.includes(task.priority)) {
      return false;
    }

    // Project filter
    if (filter.projectId && filter.projectId !== 'none') {
      if (task.projectId !== filter.projectId) return false;
    } else if (filter.projectId === 'none' && task.projectId) {
      return false;
    }

    // Labels filter
    if (filter.labels?.length) {
      const hasMatchingLabel = filter.labels.some(labelId => task.labels.includes(labelId));
      if (!hasMatchingLabel) return false;
    }

    // Date filters
    const now = new Date();
    const taskDueDate = new Date(task.dueDate);
    
    if (filter.today) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (taskDueDate < today || taskDueDate >= tomorrow) return false;
    }

    if (filter.overdue) {
      if (task.status === 'done' || taskDueDate >= now) return false;
    }

    if (filter.next7days) {
      const next7Days = new Date();
      next7Days.setDate(next7Days.getDate() + 7);
      
      if (taskDueDate < now || taskDueDate > next7Days) return false;
    }

    if (filter.dueDate) {
      if (filter.dueDate.from && taskDueDate < filter.dueDate.from) return false;
      if (filter.dueDate.to && taskDueDate > filter.dueDate.to) return false;
    }

    return true;
  });

  // Get task counts for different statuses
  const taskCounts = {
    total: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    inProgress: filteredTasks.filter(t => t.status === 'in_progress').length,
    done: filteredTasks.filter(t => t.status === 'done').length,
    overdue: filteredTasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length
  };

  // Handle task status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Handle task completion
  const handleComplete = async (taskId: string) => {
    await handleStatusChange(taskId, 'done');
  };

  // Handle task creation
  const handleTaskCreated = async () => {
    setShowCreateTask(false);
    // Refresh tasks
    const updatedTasks = await taskService.getTasks();
    setTasks(updatedTasks);
  };

  // Render task list view
  const renderTaskList = () => (
    <div className="space-y-3">
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || Object.keys(filter).length > 0 ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || Object.keys(filter).length > 0
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first task to get started'
                }
              </p>
              <Button onClick={() => setShowCreateTask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredTasks.map((task) => {
          const project = projects.find(p => p.id === task.projectId);
          const taskLabels = labels.filter(l => task.labels.includes(l.id));
          const isOverdue = task.status !== 'done' && new Date(task.dueDate) < new Date();

          return (
            <Card 
              key={task.id} 
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                task.status === 'done' && "opacity-75",
                isOverdue && "border-red-200 bg-red-50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Title and Status */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {task.status === 'done' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <h3 className={cn(
                          "font-medium",
                          task.status === 'done' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                      </div>
                      
                      {/* Priority indicator */}
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        task.priority === 'urgent' && "bg-red-500",
                        task.priority === 'high' && "bg-orange-500",
                        task.priority === 'medium' && "bg-yellow-500",
                        task.priority === 'low' && "bg-green-500"
                      )} />
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        task.status === 'done' && "line-through"
                      )}>
                        {task.description}
                      </p>
                    )}

                    {/* Meta information */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {/* Due date */}
                      <div className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-red-600"
                      )}>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
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
                    </div>

                    {/* Labels */}
                    {taskLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
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
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
          <p className="text-muted-foreground">Organize and track your tasks efficiently</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your workflow
                </DialogDescription>
              </DialogHeader>
              <TaskForm 
                projects={projects}
                labels={labels}
                onSuccess={handleTaskCreated}
                onCancel={() => setShowCreateTask(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To Do</CardTitle>
            <Circle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCounts.todo}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{taskCounts.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskCounts.done}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            filter={filter}
            onFilterChange={setFilter}
            projects={projects}
            labels={labels}
          />
        </div>

        {/* Tasks Content */}
        <div className="lg:col-span-3">
          {viewMode === 'kanban' ? (
            <KanbanBoard
              tasks={filteredTasks}
              projects={projects}
              labels={labels}
              onStatusChange={handleStatusChange}
              onComplete={handleComplete}
            />
          ) : (
            renderTaskList()
          )}
        </div>
      </div>
    </div>
  );
}
