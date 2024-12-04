export type UserRole = 'trainer' | 'admin' | 'administrative_assistant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AttendanceRecord {
  id: string;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface TrainerStats {
  totalHours: number;
  approvedRecords: number;
  pendingRecords: number;
}
