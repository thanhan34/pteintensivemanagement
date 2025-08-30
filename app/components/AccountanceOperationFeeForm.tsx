'use client';

import { useState } from 'react';
import { OperationFeeInput } from '../types/operation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useSession } from 'next-auth/react';

interface AccountanceOperationFeeFormProps {
  currentDate: string;
  onUpdate: () => void;
}

export default function AccountanceOperationFeeForm({
  currentDate,
  onUpdate,
}: AccountanceOperationFeeFormProps) {
  const { data: session } = useSession();
  const [newFee, setNewFee] = useState<OperationFeeInput>({
    trainerName: '',
    amount: 0,
    date: currentDate,
    notes: '',
    type: '',
    implementer: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleAddFee = async () => {
    if (!session?.user?.id) return;
    
    setIsSubmitting(true);
    setSubmitMessage('');
    
    try {
      const feeData = {
        ...newFee,
        createdAt: serverTimestamp(),
        isProcess: false,
        status: 'pending' as const,
        createdBy: session.user.id
      };

      await addDoc(collection(db, 'operationFees'), feeData);
      
      setNewFee({
        trainerName: '',
        amount: 0,
        date: currentDate,
        notes: '',
        type: '',
        implementer: ''
      });
      
      setSubmitMessage('Chi phí đã được gửi và đang chờ phê duyệt!');
      onUpdate(); // Trigger refetch after add
    } catch (error) {
      console.error('Error adding operation fee:', error);
      setSubmitMessage('Có lỗi xảy ra khi gửi chi phí. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = newFee.trainerName.trim() !== '' && newFee.amount > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-[#fc5d01]">Nhập Chi Phí Hoạt Động</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chi tiết chi phí <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Nhập chi tiết chi phí"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            value={newFee.trainerName}
            onChange={(e) => setNewFee({...newFee, trainerName: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số Tiền (VND) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="Nhập số tiền"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            value={newFee.amount}
            onChange={(e) => setNewFee({...newFee, amount: Number(e.target.value)})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            value={newFee.date}
            onChange={(e) => setNewFee({...newFee, date: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại Chi Phí
          </label>
          <input
            type="text"
            placeholder="Nhập loại chi phí"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            value={newFee.type}
            onChange={(e) => setNewFee({...newFee, type: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CV Thực Hiện
          </label>
          <input
            type="text"
            placeholder="Nhập tên CV thực hiện"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            value={newFee.implementer || ''}
            onChange={(e) => setNewFee({...newFee, implementer: e.target.value})}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ghi Chú
          </label>
          <textarea
            placeholder="Nhập ghi chú (tùy chọn)"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            rows={3}
            value={newFee.notes}
            onChange={(e) => setNewFee({...newFee, notes: e.target.value})}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <button
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            isFormValid && !isSubmitting
              ? 'bg-[#fc5d01] text-white hover:bg-[#fd7f33]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleAddFee}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi Chi Phí'}
        </button>
        
        {submitMessage && (
          <div className={`p-3 rounded-md text-sm ${
            submitMessage.includes('lỗi') 
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {submitMessage}
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-[#fedac2] rounded-md">
        <p className="text-sm text-gray-700">
          <strong>Lưu ý:</strong> Sau khi gửi, chi phí sẽ ở trạng thái chờ phê duyệt. 
          Admin sẽ xem xét và phê duyệt chi phí của bạn.
        </p>
      </div>
    </div>
  );
}
