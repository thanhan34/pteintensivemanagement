import { FieldValue, Timestamp } from 'firebase/firestore';

export interface OperationFee {
  id?: string;
  trainerName: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string | FieldValue | Timestamp;
}

export type OperationFeeInput = Omit<OperationFee, 'id' | 'createdAt'>;

export interface FirestoreOperationFee extends Omit<OperationFee, 'createdAt'> {
  createdAt: FieldValue;
}
