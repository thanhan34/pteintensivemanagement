'use client';

import { useSession } from 'next-auth/react';
import TaskShell from '@/app/components/task-system/TaskShell';
import TaskPageHeader from '@/app/components/task-system/TaskPageHeader';
import UserManagementTable from '@/app/components/task-system/UserManagementTable';
import { useTaskUsers } from '@/app/hooks/use-task-system';
import { taskSystemService } from '@/app/services/task-system.service';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const { users, loading } = useTaskUsers();

  if (session?.user?.role !== 'admin') {
    return <TaskShell><div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-600 shadow-sm">Admin access required.</div></TaskShell>;
  }

  return (
    <TaskShell>
      <TaskPageHeader title="Admin user management" description="Manage user roles and activation for the task system." />
      {loading ? <div className="text-sm text-slate-500">Loading users...</div> : <UserManagementTable users={users} onRoleChange={taskSystemService.updateUserRole} onToggleActive={taskSystemService.updateUserStatus} />}
    </TaskShell>
  );
}
