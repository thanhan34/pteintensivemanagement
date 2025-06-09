'use client';

import { useState } from 'react';
import { TaskFilter, Project, Label, TaskStatus, TaskPriority } from '../types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label as UILabel } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  X, 
  Filter,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  Calendar as CalendarDays,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  projects: Project[];
  labels: Label[];
}

export default function FilterPanel({ filter, onFilterChange, projects, labels }: FilterPanelProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filter.dueDate?.from,
    to: filter.dueDate?.to
  });

  // Handle status filter
  const handleStatusChange = (status: TaskStatus, checked: boolean) => {
    const currentStatuses = filter.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFilterChange({
      ...filter,
      status: newStatuses.length > 0 ? newStatuses : undefined
    });
  };

  // Handle priority filter
  const handlePriorityChange = (priority: TaskPriority, checked: boolean) => {
    const currentPriorities = filter.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    
    onFilterChange({
      ...filter,
      priority: newPriorities.length > 0 ? newPriorities : undefined
    });
  };

  // Handle project filter
  const handleProjectChange = (projectId: string) => {
    onFilterChange({
      ...filter,
      projectId: projectId === 'all' ? undefined : projectId
    });
  };

  // Handle label filter
  const handleLabelChange = (labelId: string, checked: boolean) => {
    const currentLabels = filter.labels || [];
    const newLabels = checked
      ? [...currentLabels, labelId]
      : currentLabels.filter(l => l !== labelId);
    
    onFilterChange({
      ...filter,
      labels: newLabels.length > 0 ? newLabels : undefined
    });
  };

  // Handle quick date filters
  const handleQuickDateFilter = (type: 'today' | 'overdue' | 'next7days') => {
    const newFilter = { ...filter };
    
    // Reset other date filters
    newFilter.today = false;
    newFilter.overdue = false;
    newFilter.next7days = false;
    newFilter.dueDate = undefined;
    
    // Set the selected filter
    newFilter[type] = true;
    
    onFilterChange(newFilter);
  };

  // Handle custom date range
  const handleDateRangeChange = () => {
    onFilterChange({
      ...filter,
      dueDate: dateRange.from || dateRange.to ? dateRange : undefined,
      today: false,
      overdue: false,
      next7days: false
    });
    setShowDatePicker(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange({});
    setDateRange({ from: undefined, to: undefined });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filter.status?.length) count++;
    if (filter.priority?.length) count++;
    if (filter.projectId) count++;
    if (filter.labels?.length) count++;
    if (filter.dueDate || filter.today || filter.overdue || filter.next7days) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-6"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <UILabel className="text-sm font-medium">Status</UILabel>
          <div className="space-y-2">
            {[
              { value: 'todo' as TaskStatus, label: 'To Do', icon: Circle },
              { value: 'in_progress' as TaskStatus, label: 'In Progress', icon: Clock },
              { value: 'done' as TaskStatus, label: 'Done', icon: CheckCircle2 }
            ].map(({ value, label, icon: Icon }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${value}`}
                  checked={filter.status?.includes(value) || false}
                  onCheckedChange={(checked) => handleStatusChange(value, checked as boolean)}
                />
                <UILabel htmlFor={`status-${value}`} className="text-sm flex items-center gap-2">
                  <Icon className="h-3 w-3" />
                  {label}
                </UILabel>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Priority Filter */}
        <div className="space-y-2">
          <UILabel className="text-sm font-medium">Priority</UILabel>
          <div className="space-y-2">
            {[
              { value: 'urgent' as TaskPriority, label: 'Urgent', color: 'bg-red-500' },
              { value: 'high' as TaskPriority, label: 'High', color: 'bg-orange-500' },
              { value: 'medium' as TaskPriority, label: 'Medium', color: 'bg-yellow-500' },
              { value: 'low' as TaskPriority, label: 'Low', color: 'bg-green-500' }
            ].map(({ value, label, color }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${value}`}
                  checked={filter.priority?.includes(value) || false}
                  onCheckedChange={(checked) => handlePriorityChange(value, checked as boolean)}
                />
                <UILabel htmlFor={`priority-${value}`} className="text-sm flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", color)} />
                  {label}
                </UILabel>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Project Filter */}
        <div className="space-y-2">
          <UILabel className="text-sm font-medium">Project</UILabel>
          <Select
            value={filter.projectId || 'all'}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="none">No Project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Labels Filter */}
        {labels.length > 0 && (
          <>
            <div className="space-y-2">
              <UILabel className="text-sm font-medium">Labels</UILabel>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {labels.map((label) => (
                  <div key={label.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`label-${label.id}`}
                      checked={filter.labels?.includes(label.id) || false}
                      onCheckedChange={(checked) => handleLabelChange(label.id, checked as boolean)}
                    />
                    <UILabel htmlFor={`label-${label.id}`} className="text-sm flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </UILabel>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Date Filters */}
        <div className="space-y-3">
          <UILabel className="text-sm font-medium">Due Date</UILabel>
          
          {/* Quick Date Filters */}
          <div className="space-y-2">
            <Button
              variant={filter.today ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleQuickDateFilter('today')}
            >
              <CalendarDays className="h-3 w-3 mr-2" />
              Due Today
            </Button>
            
            <Button
              variant={filter.overdue ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleQuickDateFilter('overdue')}
            >
              <AlertTriangle className="h-3 w-3 mr-2" />
              Overdue
            </Button>
            
            <Button
              variant={filter.next7days ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => handleQuickDateFilter('next7days')}
            >
              <Target className="h-3 w-3 mr-2" />
              Next 7 Days
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="space-y-2">
            <UILabel className="text-xs text-muted-foreground">Custom Range</UILabel>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleDateRangeChange}
                      className="flex-1"
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                        setShowDatePicker(false);
                      }}
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <UILabel className="text-sm font-medium">Active Filters</UILabel>
              <div className="flex flex-wrap gap-1">
                {filter.status?.map(status => (
                  <Badge key={status} variant="secondary" className="text-xs">
                    {status.replace('_', ' ')}
                    <X 
                      className="h-2 w-2 ml-1 cursor-pointer" 
                      onClick={() => handleStatusChange(status, false)}
                    />
                  </Badge>
                ))}
                {filter.priority?.map(priority => (
                  <Badge key={priority} variant="secondary" className="text-xs">
                    {priority}
                    <X 
                      className="h-2 w-2 ml-1 cursor-pointer" 
                      onClick={() => handlePriorityChange(priority, false)}
                    />
                  </Badge>
                ))}
                {filter.projectId && (
                  <Badge variant="secondary" className="text-xs">
                    {projects.find(p => p.id === filter.projectId)?.name || 'Project'}
                    <X 
                      className="h-2 w-2 ml-1 cursor-pointer" 
                      onClick={() => handleProjectChange('all')}
                    />
                  </Badge>
                )}
                {filter.labels?.map(labelId => {
                  const label = labels.find(l => l.id === labelId);
                  return (
                    <Badge key={labelId} variant="secondary" className="text-xs">
                      {label?.name || 'Label'}
                      <X 
                        className="h-2 w-2 ml-1 cursor-pointer" 
                        onClick={() => handleLabelChange(labelId, false)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
