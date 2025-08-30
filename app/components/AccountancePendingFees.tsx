'use client';

import { OperationFee } from '../types/operation';
import { useSession } from 'next-auth/react';

interface AccountancePendingFeesProps {
  operationFees: OperationFee[];
  formatVND: (amount: number) => string;
  formatDate: (date: string) => string;
}

export default function AccountancePendingFees({
  operationFees,
  formatVND,
  formatDate,
}: AccountancePendingFeesProps) {
  const { data: session } = useSession();
  
  // Filter fees created by current accountance user that are still pending
  const userPendingFees = operationFees.filter(fee => 
    fee.createdBy === session?.user?.id && fee.status === 'pending'
  );

  if (userPendingFees.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-[#fc5d01]">Chi Phí Đang Chờ Phê Duyệt</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Không có chi phí nào đang chờ phê duyệt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-[#fc5d01]">
        Chi Phí Đang Chờ Phê Duyệt ({userPendingFees.length})
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-[#fedac2]">
              <th className="px-4 py-3 border text-left font-medium text-gray-700">Chi tiết chi phí</th>
              <th className="px-4 py-3 border text-left font-medium text-gray-700">Số Tiền</th>
              <th className="px-4 py-3 border text-left font-medium text-gray-700">Ngày</th>
              <th className="px-4 py-3 border text-left font-medium text-gray-700">Loại</th>
              <th className="px-4 py-3 border text-left font-medium text-gray-700">CV Thực Hiện</th>
              <th className="px-4 py-3 border text-left font-medium text-gray-700">Ghi Chú</th>
              <th className="px-4 py-3 border text-left font-medium text-gray-700">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {userPendingFees.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border">{fee.trainerName}</td>
                <td className="px-4 py-3 border font-medium text-[#fc5d01]">
                  {formatVND(fee.amount)}
                </td>
                <td className="px-4 py-3 border">{formatDate(fee.date)}</td>
                <td className="px-4 py-3 border">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {fee.type || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 border">
                  {fee.implementer || '-'}
                </td>
                <td className="px-4 py-3 border">
                  <div className="max-w-xs truncate" title={fee.notes}>
                    {fee.notes || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 border">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Chờ phê duyệt
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Thông tin:</strong> Các chi phí này đang chờ admin phê duyệt. 
          Sau khi được phê duyệt, chúng sẽ không còn hiển thị trong danh sách này.
        </p>
      </div>
    </div>
  );
}
