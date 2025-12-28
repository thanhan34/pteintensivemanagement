export type UserRole = 'trainer' | 'admin' | 'administrative_assistant' | 'accountance' | 'saler';

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
  createdBy: string; // ID of user who created this record
  isBackfill: boolean; // true if this is a backfill attendance
  backfillReason?: string; // reason for backfill (required if isBackfill is true)
  createdAt?: string;
  sessionNumber?: number; // Session number for multiple check-ins per day
  activityType?: string; // Type of activity for this session
}

export interface TrainerStats {
  totalHours: number;
  approvedRecords: number;
  pendingRecords: number;
}
