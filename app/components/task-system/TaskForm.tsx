'use client';

import { FormEvent, useMemo, useState } from 'react';
import { TaskFormValues, TaskRecord, TaskUserProfile } from '@/app/types/task-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/app/utils/task-system-permissions';

const DEFAULT_VALUES: TaskFormValues = {
  title: '',
  description: '',
  assigneeIds: [],
  watcherIds: [],
  priority: 'medium',
  status: 'new',
  dueDate: '',
  attachments: [],
};

export default function TaskForm({
  users,
  initialTask,
  onSubmit,
  submitLabel,
  allowStatus = true,
}: {
  users: TaskUserProfile[];
  initialTask?: TaskRecord | null;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  submitLabel: string;
  allowStatus?: boolean;
}) {
  const [values, setValues] = useState<TaskFormValues>({
    ...DEFAULT_VALUES,
    ...(initialTask
      ? {
          title: initialTask.title,
          description: initialTask.description,
          assigneeIds: initialTask.assigneeIds,
          watcherIds: initialTask.watcherIds,
          priority: initialTask.priority,
          status: initialTask.status,
          dueDate: initialTask.dueDate ? new Date(initialTask.dueDate.getTime() - initialTask.dueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '',
        }
      : {}),
  });
  const [submitting, setSubmitting] = useState(false);

  const memberOptions = useMemo(() => users.filter((user) => user.isActive), [users]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelection = (key: 'assigneeIds' | 'watcherIds', userId: string) => {
    setValues((current) => ({
      ...current,
      [key]: current[key].includes(userId) ? current[key].filter((id) => id !== userId) : [...current[key], userId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
          <Input value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required className="border-orange-100" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <Textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} rows={5} className="border-orange-100" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
          <Select value={values.priority} onValueChange={(value) => setValues({ ...values, priority: value as TaskFormValues['priority'] })}>
            <SelectTrigger className="border-orange-100"><SelectValue /></SelectTrigger>
            <SelectContent>{TASK_PRIORITY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due date</label>
          <Input type="date" value={values.dueDate} onChange={(e) => setValues({ ...values, dueDate: e.target.value })} className="border-orange-100" />
        </div>
        {allowStatus && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <Select value={values.status} onValueChange={(value) => setValues({ ...values, status: value as TaskFormValues['status'] })}>
              <SelectTrigger className="border-orange-100"><SelectValue /></SelectTrigger>
              <SelectContent>{TASK_STATUS_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Attachments</label>
          <Input type="file" multiple onChange={(e) => setValues({ ...values, attachments: Array.from(e.target.files || []) })} className="border-orange-100" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-orange-100 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">Assignees</div>
          <div className="space-y-2">
            {memberOptions.map((user) => (
              <label key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-orange-50">
                <input type="checkbox" checked={values.assigneeIds.includes(user.id)} onChange={() => toggleSelection('assigneeIds', user.id)} />
                <span className="text-sm text-slate-700">{user.name} <span className="text-slate-400">({user.email})</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-orange-100 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-800">Watchers</div>
          <div className="space-y-2">
            {memberOptions.map((user) => (
              <label key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-orange-50">
                <input type="checkbox" checked={values.watcherIds.includes(user.id)} onChange={() => toggleSelection('watcherIds', user.id)} />
                <span className="text-sm text-slate-700">{user.name} <span className="text-slate-400">({user.email})</span></span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} className="bg-[#fc5d01] text-white hover:bg-[#e55300]">
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
