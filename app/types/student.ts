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
  type: 'one-on-one' | 'class' | '2345';
}

export type StudentFormData = Omit<Student, 'id'>;
