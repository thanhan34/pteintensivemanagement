'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Task, Label, CreateTaskData } from '../types/task';
import { taskService, labelService, userService } from '../utils/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock3, ListTodo, Plus, Send } from 'lucide-react';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import KanbanBoard from '../components/KanbanBoard';

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email?: string; role?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'kanban'>('list');
  const [submittingReport, setSubmittingReport] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  const loadTasks = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const tasksData = await taskService.getTasks({
        viewerUserId: session.user.id,
        viewerRole: session.user.role,
        includeTemplates: false
      });

      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [session]);

  const loadInitialData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const [tasksData, labelsData, usersData] = await Promise.all([
        taskService.getTasks({
          viewerUserId: session.user.id,
          viewerRole: session.user.role,
          includeTemplates: false
        }),
        labelService.getLabels(),
        userService.getUsers()
      ]);

      setTasks(tasksData);
      setLabels(labelsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading tasks page data:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      loadInitialData();
    }
  }, [session, loadInitialData]);

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'done').length
    };
  }, [tasks]);

  const handleSubmitEndOfDayReport = async () => {
    try {
      setSubmittingReport(true);
      const response = await fetch('/api/tasks/end-of-day-report', {
        method: 'POST'
      });

      const rawBody = await response.text();
      let data: { success: boolean; message: string };

      try {
        data = JSON.parse(rawBody) as { success: boolean; message: string };
      } catch {
        data = {
          success: false,
          message: response.ok
            ? 'Phản hồi không hợp lệ từ máy chủ.'
            : `Máy chủ trả về lỗi (${response.status}).`
        };
      }

      if (!response.ok || !data.success) {
        alert(data.message || 'Không thể gửi báo cáo cuối ngày.');
        return;
      }

      alert(data.message || 'Đã gửi báo cáo cuối ngày lên Discord.');
    } catch (error) {
      console.error('Error submitting end-of-day report:', error);
      alert('Không thể gửi báo cáo cuối ngày. Vui lòng thử lại sau.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleUpdateTask = async (taskData: CreateTaskData) => {
    if (!editingTask) return;

    await taskService.updateTask(editingTask.id, {
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      assignedTo: taskData.assignedTo,
      projectId: taskData.projectId || undefined,
      labels: taskData.labels,
      isRecurring: taskData.isRecurring,
      recurringPattern: taskData.recurringPattern,
      reminderTime: taskData.reminderTime
    });
  };

  const handleDeleteTask = async (task: Task) => {
    if (!isAdmin) return;

    const shouldDelete = window.confirm(`Xóa task "${task.title}"?`);
    if (!shouldDelete) return;

    await taskService.deleteTask(task.id);
    await loadTasks();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">Please sign in to access tasks</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Theo dõi task hằng ngày và task phát sinh</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSubmitEndOfDayReport}
            disabled={submittingReport}
          >
            <Send className="h-4 w-4 mr-2" />
            {submittingReport ? 'Đang gửi...' : 'Nộp báo cáo cuối ngày'}
          </Button>

          {isAdmin && (
            <>
              <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>Tạo task trực tiếp tại trang Tasks (không cần Project)</DialogDescription>
                  </DialogHeader>
                  <TaskForm
                    projects={[]}
                    labels={labels}
                    showProjectField={false}
                    assignableUsers={users}
                    onSuccess={async () => {
                      setShowCreateTask(false);
                      await loadTasks();
                    }}
                    onCancel={() => setShowCreateTask(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>Cập nhật thông tin task</DialogDescription>
                  </DialogHeader>
                  {editingTask && (
                    <TaskForm
                      projects={[]}
                      labels={labels}
                      showProjectField={false}
                      assignableUsers={users}
                      initialData={{
                        title: editingTask.title,
                        description: editingTask.description,
                        dueDate: editingTask.dueDate,
                        priority: editingTask.priority,
                        assignedTo: editingTask.assignedTo,
                        projectId: editingTask.projectId,
                        labels: editingTask.labels,
                        isRecurring: editingTask.isRecurring,
                        recurringPattern: editingTask.recurringPattern,
                        reminderTime: editingTask.reminderTime
                      }}
                      onSubmitTask={async (taskData) => {
                        await handleUpdateTask(taskData);
                      }}
                      submitLabel="Save Changes"
                      onSuccess={async () => {
                        setEditingTask(null);
                        await loadTasks();
                      }}
                      onCancel={() => setEditingTask(null)}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">To Do</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.todo}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">In Progress</CardTitle>
            <Clock3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600">{stats.inProgress}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Done</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{stats.done}</CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'kanban')}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tasks</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{tasks.length} tasks</Badge>
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="list" className="space-y-3">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Chưa có task nào.
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projects={[]}
                labels={labels}
                users={users}
                canManage={isAdmin}
                onEdit={(task) => setEditingTask(task)}
                onDelete={handleDeleteTask}
                onStatusChange={async (taskId, newStatus) => {
                  await taskService.updateTask(taskId, { status: newStatus });
                  await loadTasks();
                }}
                onComplete={async (taskId) => {
                  if (!session?.user?.id) return;
                  await taskService.completeTask(taskId, session.user.id);
                  await loadTasks();
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanBoard
            tasks={tasks}
            projects={[]}
            labels={labels}
            users={users}
            onStatusChange={async (taskId, newStatus) => {
              await taskService.updateTask(taskId, { status: newStatus });
              await loadTasks();
            }}
            onComplete={async (taskId) => {
              if (!session?.user?.id) return;
              await taskService.completeTask(taskId, session.user.id);
              await loadTasks();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
