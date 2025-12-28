import { FieldValue, Timestamp } from 'firebase/firestore';

export interface OperationFee {
  id?: string;
  trainerName: string; // Sẽ đổi thành "Chi tiết chi phí"
  amount: number;
  date: string;
  notes: string;
  type: string; // Đổi từ enum thành string để cho phép nhập tự do
  createdAt: string | FieldValue | Timestamp;
  isProcess?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  createdBy?: string; // ID of user who created this record
  approvedBy?: string; // ID of admin who approved/rejected
  approvedAt?: string; // Date when approved/rejected
  implementer?: string; // CV Thực Hiện
  imageUrls?: string[]; // Array of image URLs for receipts
}

export type OperationFeeInput = Omit<OperationFee, 'id' | 'createdAt'>;

export interface FirestoreOperationFee extends Omit<OperationFee, 'createdAt'> {
  createdAt: FieldValue;
}
