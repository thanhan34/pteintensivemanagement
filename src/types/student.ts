export interface Student {
  id: string;
  name: string;
  targetScore: number;
  startDate: string;
  studyDuration: number; // in months
  tuitionPaymentDates: string[];
  tuitionPaymentStatus: 'paid' | 'pending' | 'overdue';
  trainerName: string;
  tuitionFee: number;
  notes: string;
}

export type StudentFormData = Omit<Student, 'id'>;
