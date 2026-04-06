'use client';

import { TaskUserProfile } from '@/app/types/task-system';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function UserManagementTable({
  users,
  onRoleChange,
  onToggleActive,
}: {
  users: TaskUserProfile[];
  onRoleChange: (userId: string, role: string) => Promise<void>;
  onToggleActive: (userId: string, isActive: boolean) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>System role</TableHead>
            <TableHead>Ticket role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Select value={user.role} onValueChange={(value) => onRoleChange(user.id, value)}>
                  <SelectTrigger className="w-[180px] border-orange-100"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="trainer">Member</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{user.isActive ? 'Active' : 'Disabled'}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" className="border-orange-200 text-[#fc5d01] hover:bg-orange-50" onClick={() => onToggleActive(user.id, !user.isActive)}>
                  {user.isActive ? 'Disable' : 'Enable'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
