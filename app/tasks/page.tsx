'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task, Project, CreateProjectData } from '../types/task';
import { taskService, projectService } from '../utils/taskService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label as UILabel } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  FolderOpen,
  Users,
  Calendar,
  ArrowRight,
  Target,
  CheckCircle2,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PROJECT_COLORS = [
  '#fc5d01', '#fd7f33', '#ffac7b', '#fdbc94', '#fedac2',
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
];

// Project Card Component
interface ProjectCardProps {
  project: Project;
  onNavigate: (projectId: string) => void;
  currentUserId: string;
}

function ProjectCard({ project, onNavigate, currentUserId }: ProjectCardProps) {
  const isOwner = project.createdBy === currentUserId;
  const isMember = project.members.includes(currentUserId);

  return (
    <Card 
      className="transition-all duration-200 hover:shadow-md cursor-pointer group"
      onClick={() => onNavigate(project.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: project.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description || 'No description'}
              </p>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Members */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{project.members.length + 1} member{project.members.length !== 0 ? 's' : ''}</span>
            {isMember && !isOwner && (
              <Badge variant="secondary" className="text-xs">Member</Badge>
            )}
            {isOwner && (
              <Badge variant="default" className="text-xs bg-primary">Owner</Badge>
            )}
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Created {format(project.createdAt, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Project Form Component
interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    members: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      await projectService.createProject(formData, session.user.id);
      onSuccess();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project Name */}
      <div className="space-y-2">
        <UILabel htmlFor="name">Project Name *</UILabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter project name..."
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <UILabel htmlFor="description">Description</UILabel>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the project..."
          rows={3}
        />
      </div>

      {/* Color Selection */}
      <div className="space-y-2">
        <UILabel>Project Color</UILabel>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                formData.color === color ? "border-gray-400 scale-110" : "border-gray-200 hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Role-based access control
  const isAdmin = session?.user?.role === 'admin';
  const isTrainer = session?.user?.role === 'trainer';
  const isAssistant = session?.user?.role === 'administrative_assistant';
  const hasAccess = isAdmin || isTrainer || isAssistant;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [projectsData, tasksData] = await Promise.all([
          projectService.getProjects(),
          taskService.getTasks()
        ]);
        
        setProjects(projectsData);
        // Get recent tasks (last 10 tasks)
        setRecentTasks(tasksData.slice(0, 10));
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

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get project statistics
  const getProjectStats = () => {
    const myProjects = projects.filter(p => p.createdBy === session?.user?.id);
    const sharedProjects = projects.filter(p => p.members.includes(session?.user?.id || ''));
    const totalTasks = recentTasks.length;
    const completedTasks = recentTasks.filter(t => t.status === 'done').length;
    
    return {
      totalProjects: projects.length,
      myProjects: myProjects.length,
      sharedProjects: sharedProjects.length,
      totalTasks,
      completedTasks
    };
  };

  const stats = getProjectStats();

  // Handle project creation
  const handleProjectCreated = async () => {
    setShowCreateProject(false);
    // Refresh projects
    const updatedProjects = await projectService.getProjects();
    setProjects(updatedProjects);
  };

  // Navigate to project detail
  const navigateToProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  // Authentication and authorization checks
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl text-red-500">Please sign in to access this page</div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl text-red-500">You do not have permission to access this page</div>
            <p className="mt-2 text-muted-foreground">
              Only administrators, trainers, and administrative assistants can access the project management system.
            </p>
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
          <h1 className="text-3xl font-bold text-foreground">Project Hub</h1>
          <p className="text-muted-foreground">Create projects, invite team members, and manage tasks together</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new project to organize your tasks and collaborate with your team
                </DialogDescription>
              </DialogHeader>
              <ProjectForm 
                onSuccess={handleProjectCreated}
                onCancel={() => setShowCreateProject(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Projects</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.myProjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Projects</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sharedProjects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No projects found' : 'Welcome to Project Hub!'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchTerm 
                  ? 'Try adjusting your search terms to find the project you\'re looking for.' 
                  : 'Create your first project to start organizing tasks and collaborating with your team. Just like Todoist, you can invite members and manage tasks together.'
                }
              </p>
              <Button onClick={() => setShowCreateProject(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onNavigate={navigateToProject}
              currentUserId={session?.user?.id || ''}
            />
          ))}
        </div>
      )}

      {/* Recent Tasks Section */}
      {recentTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
              View All Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTasks.slice(0, 6).map((task) => {
              const project = projects.find(p => p.id === task.projectId);
              const isOverdue = task.status !== 'done' && new Date(task.dueDate) < new Date();
              
              return (
                <Card 
                  key={task.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-md cursor-pointer",
                    task.status === 'done' && "opacity-75",
                    isOverdue && "border-red-200 bg-red-50"
                  )}
                  onClick={() => project && navigateToProject(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {task.status === 'done' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            task.priority === 'urgent' && "bg-red-500",
                            task.priority === 'high' && "bg-orange-500",
                            task.priority === 'medium' && "bg-yellow-500",
                            task.priority === 'low' && "bg-green-500"
                          )} />
                        )}
                        <h3 className={cn(
                          "font-medium text-sm truncate",
                          task.status === 'done' && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </h3>
                      </div>
                      
                      {project && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(task.dueDate, 'MMM d')}</span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
