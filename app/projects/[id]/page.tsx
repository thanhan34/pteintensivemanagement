'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Project, Task, Label, TaskStatus } from '../../types/task';
import { taskService, projectService, labelService, userService } from '../../utils/taskService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  ArrowLeft, 
  Users, 
  UserPlus,
  Settings,
} from 'lucide-react';
import TaskForm from '../../components/TaskForm';
import TaskCard from '../../components/TaskCard';
import KanbanBoard from '../../components/KanbanBoard';

export default function ProjectDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [users, setUsers] = useState<Array<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'kanban'>('list');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchUsers, setSearchUsers] = useState('');

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const [projectData, projectTasks, labelsData, usersData] = await Promise.all([
          projectService.getProject(projectId),
          taskService.getTasksByProject(projectId),
          labelService.getLabels(),
          userService.getUsers()
        ]);
        
        setProject(projectData);
        setTasks(projectTasks);
        setLabels(labelsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading project data:', error);
        router.push('/tasks');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id && projectId) {
      loadProjectData();
    }
  }, [session, projectId, router]);

  // Get task counts
  const taskCounts = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length
  };

  // Handle task creation
  const handleTaskCreated = async () => {
    setShowCreateTask(false);
    // Refresh tasks
    const updatedTasks = await taskService.getTasksByProject(projectId);
    setTasks(updatedTasks);
  };

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    if (!session?.user?.id) return;
    
    try {
      await taskService.completeTask(taskId, session.user.id);
      // Refresh tasks
      const updatedTasks = await taskService.getTasksByProject(projectId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Handle task status change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      // Refresh tasks
      const updatedTasks = await taskService.getTasksByProject(projectId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  // Handle invite member
  const handleInviteMember = async () => {
    if (!selectedUserId || !project) return;
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) return;
    
    try {
      await projectService.inviteMember(project.id, selectedUser.id);
      setSelectedUserId('');
      setShowInviteMembers(false);
      // Refresh project data
      const updatedProject = await projectService.getProject(projectId);
      setProject(updatedProject);
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  // Filter users for invite
  const filteredUsers = users.filter(user => {
    // Exclude current user and already invited members
    if (user.id === session?.user?.id) return false;
    if (project?.members.includes(user.id)) return false;
    if (project?.createdBy === user.id) return false;
    
    // Filter by search term
    if (searchUsers) {
      const searchLower = searchUsers.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Check if user is project owner
  const isOwner = project?.createdBy === session?.user?.id;
  const isMember = project?.members.includes(session?.user?.id || '');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
                  <p className="text-muted-foreground mb-4">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.push('/tasks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>

      {/* Project Info */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <div>
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {project.description || 'No description provided'}
                    </CardDescription>
                  </div>
                </div>
                
                {isOwner && (
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{taskCounts.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{taskCounts.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{taskCounts.done}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{taskCounts.overdue}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Members */}
        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Team Members</CardTitle>
                {(isOwner || isMember) && (
                  <Dialog open={showInviteMembers} onOpenChange={setShowInviteMembers}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          Invite someone to collaborate on this project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Search Users */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Search Users</label>
                          <Input
                            placeholder="Search by name or email..."
                            value={searchUsers}
                            onChange={(e) => setSearchUsers(e.target.value)}
                          />
                        </div>

                        {/* Users List */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select User to Invite</label>
                          <div className="max-h-60 overflow-y-auto border rounded-md">
                            {filteredUsers.length === 0 ? (
                              <div className="p-4 text-center text-muted-foreground">
                                {searchUsers ? 'No users found' : 'No available users to invite'}
                              </div>
                            ) : (
                              <div className="space-y-1 p-2">
                                {filteredUsers.map((user) => (
                                  <div
                                    key={user.id}
                                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                      selectedUserId === user.id 
                                        ? 'bg-primary/10 border border-primary' 
                                        : 'hover:bg-muted'
                                    }`}
                                    onClick={() => setSelectedUserId(user.id)}
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">
                                        {user.name || 'Unknown User'}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                      </div>
                                      {user.role && (
                                        <Badge variant="outline" className="text-xs mt-1">
                                          {user.role}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowInviteMembers(false);
                              setSelectedUserId('');
                              setSearchUsers('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleInviteMember}
                            disabled={!selectedUserId}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite User
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Project Owner */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {isOwner ? 'You' : 'Project Owner'}
                    </div>
                    <Badge variant="default" className="text-xs">Owner</Badge>
                  </div>
                </div>

                {/* Members */}
                {project.members.length > 0 && (
                  <>
                    <Separator />
                    {project.members.map((memberId) => {
                      const memberUser = users.find(u => u.id === memberId);
                      return (
                        <div key={memberId} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {memberUser?.name?.charAt(0) || memberUser?.email?.charAt(0) || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {memberUser?.name || memberUser?.email || 'Unknown User'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">Member</Badge>
                              {memberUser?.role && (
                                <Badge variant="outline" className="text-xs">
                                  {memberUser.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {project.members.length === 0 && (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No team members yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Project Tasks</h2>
          <Badge variant="secondary">{taskCounts.total}</Badge>
        </div>
        
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Task for {project.name}</DialogTitle>
              <DialogDescription>
                Add a new task to this project
              </DialogDescription>
            </DialogHeader>
            <TaskForm 
              projects={[project]}
              labels={labels}
              onSuccess={handleTaskCreated}
              onCancel={() => setShowCreateTask(false)}
              initialData={{ projectId: project.id }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks View */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'kanban')}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first task for this project
                  </p>
                  <Button onClick={() => setShowCreateTask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projects={[project]}
                  labels={labels}
                  onStatusChange={handleStatusChange}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="kanban">
          <KanbanBoard
            tasks={tasks}
            projects={[project]}
            labels={labels}
            onStatusChange={handleStatusChange}
            onComplete={handleCompleteTask}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
