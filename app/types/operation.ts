import { FieldValue, Timestamp } from 'firebase/firestore';

export interface OperationFee {
  id?: string;
  trainerName: string;
  amount: number;
  date: string;
  notes: string;
  type: 'one-on-one' | 'class' | '2345';
  createdAt: string | FieldValue | Timestamp;
}

export type OperationFeeInput = Omit<OperationFee, 'id' | 'createdAt'>;

export interface FirestoreOperationFee extends Omit<OperationFee, 'createdAt'> {
  createdAt: FieldValue;
}
