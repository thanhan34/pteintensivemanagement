'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Project, Label, CreateTaskData, TaskPriority, RecurringPattern, CreateProjectData } from '../types/task';
import { taskService, projectService } from '../utils/taskService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label as UILabel } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskFormProps {
  projects: Project[];
  labels: Label[];
  showProjectField?: boolean;
  assignableUsers?: Array<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
  }>;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<CreateTaskData>;
  onSubmitTask?: (taskData: CreateTaskData) => Promise<void>;
  submitLabel?: string;
}

export default function TaskForm({
  projects,
  labels,
  showProjectField = true,
  assignableUsers = [],
  onSuccess,
  onCancel,
  initialData,
  onSubmitTask,
  submitLabel
}: TaskFormProps) {
  const isEditMode = Boolean(onSubmitTask);
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [bulkTitles, setBulkTitles] = useState('');
  const [formData, setFormData] = useState<CreateTaskData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    dueDate: initialData?.dueDate || new Date(),
    priority: initialData?.priority || 'medium',
    assignedTo: initialData?.assignedTo || [],
    projectId: initialData?.projectId || '',
    labels: initialData?.labels || [],
    isRecurring: initialData?.isRecurring || false,
    recurringPattern: initialData?.recurringPattern || 'weekly',
    reminderTime: initialData?.reminderTime || undefined
  });

  const [selectedLabels, setSelectedLabels] = useState<string[]>(formData.labels);
  const [newLabelName, setNewLabelName] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showReminderCalendar, setShowReminderCalendar] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<Project[]>(projects);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState<CreateProjectData>({
    name: '',
    description: '',
    color: '#fc5d01',
    members: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const parsedBulkTitles = bulkTitles
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const titlesToCreate = parsedBulkTitles.length > 0
        ? parsedBulkTitles
        : [formData.title.trim()].filter(Boolean);

      if (titlesToCreate.length === 0) {
        setLoading(false);
        return;
      }

      const assignees = formData.assignedTo.length > 0
        ? formData.assignedTo
        : session?.user?.id
          ? [session.user.id]
          : [];

      const basePayload: CreateTaskData = {
        ...formData,
        assignedTo: assignees,
        labels: selectedLabels
      };

      if (onSubmitTask) {
        if (titlesToCreate.length > 1) {
          throw new Error('Editing task only supports a single title.');
        }

        await onSubmitTask({
          ...basePayload,
          title: titlesToCreate[0]
        });
      } else {
        if (!session?.user?.id) {
          setLoading(false);
          return;
        }

        await Promise.all(
          titlesToCreate.map((title) =>
            taskService.createTask(
              {
                ...basePayload,
                title
              },
              session.user.id
            )
          )
        );
      }
      onSuccess();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelToggle = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const addNewLabel = () => {
    if (newLabelName.trim()) {
      // In a real implementation, you'd create the label in the database first
      setSelectedLabels(prev => [...prev, newLabelName]);
      setNewLabelName('');
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <UILabel htmlFor="title">Task Title *</UILabel>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title..."
          required
        />
        <p className="text-xs text-muted-foreground">
          {isEditMode
            ? 'Cập nhật thông tin task hiện tại'
            : 'Hoặc dùng mục bên dưới để tạo nhiều task cùng lúc (mỗi dòng một task)'}
        </p>
      </div>

      {!isEditMode && (
        <div className="space-y-2">
          <UILabel htmlFor="bulkTitles">Quick Create Multiple Tasks (Optional)</UILabel>
          <Textarea
            id="bulkTitles"
            value={bulkTitles}
            onChange={(e) => setBulkTitles(e.target.value)}
            placeholder={"Nhập nhiều task, mỗi dòng 1 task...\nGọi học viên A\nSoạn tài liệu lớp sáng\nKiểm tra attendance"}
            rows={4}
          />
        </div>
      )}

      {/* Assignees */}
      <div className="space-y-2">
        <UILabel>Assign To</UILabel>
        {assignableUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No users available. Task will be assigned to you by default.</p>
        ) : (
          <div className="max-h-44 overflow-y-auto rounded-md border p-2 space-y-2">
            {assignableUsers.map((user) => {
              const isChecked = formData.assignedTo.includes(user.id);
              return (
                <label key={user.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.name || user.email || user.id}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: checked
                          ? [...prev.assignedTo, user.id]
                          : prev.assignedTo.filter((id) => id !== user.id)
                      }));
                    }}
                    className="h-4 w-4"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <UILabel htmlFor="description">Description</UILabel>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the task..."
          rows={3}
        />
      </div>

      {/* Priority and Due Date Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Priority */}
        <div className="space-y-2">
          <UILabel>Priority *</UILabel>
          <Select
            value={formData.priority}
            onValueChange={(value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getPriorityColor(formData.priority))} />
                  {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Low
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="urgent">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Urgent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <UILabel>Due Date *</UILabel>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.dueDate}
                onSelect={(date) => {
                  if (date) {
                    setFormData(prev => ({ ...prev, dueDate: date }));
                    setShowCalendar(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showProjectField && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <UILabel>Project</UILabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateProject(!showCreateProject)}
              className="text-xs h-6"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Project
            </Button>
          </div>
          
          {showCreateProject ? (
            <div className="space-y-3 p-3 border rounded-md bg-muted/50">
              <div className="space-y-2">
                <UILabel className="text-xs">Project Name *</UILabel>
                <Input
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name..."
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <UILabel className="text-xs">Description</UILabel>
                <Input
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Project description..."
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <UILabel className="text-xs">Color</UILabel>
                <div className="flex gap-1">
                  {['#fc5d01', '#fd7f33', '#ffac7b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        newProjectData.color === color ? "border-gray-400 scale-110" : "border-gray-200 hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProjectData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    if (!session?.user?.id || !newProjectData.name.trim()) return;
                    try {
                      const projectId = await projectService.createProject(newProjectData, session.user.id);
                      const newProject: Project = {
                        id: projectId,
                        ...newProjectData,
                        createdBy: session.user.id,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      };
                      setAvailableProjects(prev => [...prev, newProject]);
                      setFormData(prev => ({ ...prev, projectId }));
                      setShowCreateProject(false);
                      setNewProjectData({ name: '', description: '', color: '#fc5d01', members: [] });
                    } catch (error) {
                      console.error('Error creating project:', error);
                    }
                  }}
                  disabled={!newProjectData.name.trim()}
                  className="bg-primary hover:bg-primary/90 h-7 text-xs"
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateProject(false);
                    setNewProjectData({ name: '', description: '', color: '#fc5d01', members: [] });
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Select
              value={formData.projectId || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Labels */}
      <div className="space-y-2">
        <UILabel>Labels</UILabel>
        <div className="space-y-3">
          {/* Selected Labels */}
          {selectedLabels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedLabels.map((labelId) => {
                const label = labels.find(l => l.id === labelId);
                return (
                  <Badge
                    key={labelId}
                    variant="secondary"
                    className="flex items-center gap-1"
                    style={{ backgroundColor: label?.color + '20', color: label?.color }}
                  >
                    {label?.name || labelId}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleLabelToggle(labelId)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Available Labels */}
          <div className="flex flex-wrap gap-2">
            {labels
              .filter(label => !selectedLabels.includes(label.id))
              .map((label) => (
                <Badge
                  key={label.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  style={{ borderColor: label.color, color: label.color }}
                  onClick={() => handleLabelToggle(label.id)}
                >
                  {label.name}
                </Badge>
              ))}
          </div>

          {/* Add New Label */}
          <div className="flex gap-2">
            <Input
              placeholder="New label name..."
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNewLabel}
              disabled={!newLabelName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Recurring Task */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={formData.isRecurring}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
          />
          <UILabel htmlFor="recurring">Recurring Task</UILabel>
        </div>

        {formData.isRecurring && (
          <div className="space-y-2">
            <UILabel>Recurring Pattern</UILabel>
            <Select
              value={formData.recurringPattern}
              onValueChange={(value: RecurringPattern) => setFormData(prev => ({ ...prev, recurringPattern: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Reminder */}
      <div className="space-y-2">
        <UILabel>Reminder (Optional)</UILabel>
        <Popover open={showReminderCalendar} onOpenChange={setShowReminderCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.reminderTime && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.reminderTime ? format(formData.reminderTime, "PPP p") : "Set reminder"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.reminderTime}
              onSelect={(date) => {
                if (date) {
                  setFormData(prev => ({ ...prev, reminderTime: date }));
                  setShowReminderCalendar(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {formData.reminderTime && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFormData(prev => ({ ...prev, reminderTime: undefined }))}
          >
            Clear reminder
          </Button>
        )}
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
          disabled={loading || (!formData.title.trim() && !isEditMode && !bulkTitles.trim())}
          className="bg-primary hover:bg-primary/90"
        >
          {loading
            ? (onSubmitTask ? 'Saving...' : 'Creating...')
            : (submitLabel || (bulkTitles.trim() ? 'Create Multiple Tasks' : 'Create Task'))}
        </Button>
      </div>
    </form>
  );
}
