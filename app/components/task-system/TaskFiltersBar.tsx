'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskFilters, TaskUserProfile } from '@/app/types/task-system';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/app/utils/task-system-permissions';

export default function TaskFiltersBar({
  filters,
  onChange,
  users,
}: {
  filters: TaskFilters;
  onChange: (next: TaskFilters) => void;
  users: TaskUserProfile[];
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
      <Input
        value={filters.keyword || ''}
        onChange={(e) => onChange({ ...filters, keyword: e.target.value })}
        placeholder="Search by code, title, description"
        className="border-orange-100"
      />

      <Select value={filters.status || 'all'} onValueChange={(value) => onChange({ ...filters, status: value as TaskFilters['status'] })}>
        <SelectTrigger className="border-orange-100"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {TASK_STATUS_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority || 'all'} onValueChange={(value) => onChange({ ...filters, priority: value as TaskFilters['priority'] })}>
        <SelectTrigger className="border-orange-100"><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {TASK_PRIORITY_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.assigneeId || 'all'} onValueChange={(value) => onChange({ ...filters, assigneeId: value })}>
        <SelectTrigger className="border-orange-100"><SelectValue placeholder="Assignee" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.due || 'all'} onValueChange={(value) => onChange({ ...filters, due: value as TaskFilters['due'] })}>
        <SelectTrigger className="border-orange-100"><SelectValue placeholder="Due" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All due dates</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
