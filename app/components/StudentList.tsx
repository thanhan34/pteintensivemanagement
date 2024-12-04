'use client';

import { useState, useEffect, useMemo } from 'react';
import { Student } from '../types/student';
import { useSession } from 'next-auth/react';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

export default function StudentList({ students, onEdit, onDelete }: StudentListProps) {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime(); // Sort in ascending order (oldest first)
    });
  }, [students]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Student['tuitionPaymentStatus']) => {
    switch (status) {
      case 'paid':
        return 'bg-[#fedac2] text-[#fc5d01]';
      case 'pending':
        return 'bg-[#ffac7b] text-[#fc5d01]';
      case 'overdue':
        return 'bg-[#fc5d01] text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Trainer</th>
              <th className="px-4 py-2 border">Target Score</th>
              <th className="px-4 py-2 border">Start Date</th>
              <th className="px-4 py-2 border">Duration</th>
              <th className="px-4 py-2 border">Tuition Fee</th>
              <th className="px-4 py-2 border">Payment Status</th>
              <th className="px-4 py-2 border">Payment Dates</th>
              <th className="px-4 py-2 border">Notes</th>
              {isAdmin && (
                <th className="px-4 py-2 border">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-2 border">{student.name}</td>
                <td className="px-4 py-2 border">{student.trainerName}</td>
                <td className="px-4 py-2 border">{student.targetScore}</td>
                <td className="px-4 py-2 border">
                  {formatDate(student.startDate)}
                </td>
                <td className="px-4 py-2 border">{student.studyDuration} months</td>
                <td className="px-4 py-2 border">{formatCurrency(student.tuitionFee)}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.tuitionPaymentStatus)}`}>
                    {student.tuitionPaymentStatus.charAt(0).toUpperCase() + student.tuitionPaymentStatus.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  {student.tuitionPaymentDates.map((date) => (
                    <div key={date}>{formatDate(date)}</div>
                  ))}
                </td>
                <td className="px-4 py-2 border">
                  <div className="max-w-xs break-words">
                    {student.notes}
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => onEdit(student)}
                      className="text-[#fc5d01] hover:text-[#fd7f33] mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(student.id)}
                      className="text-[#fc5d01] hover:text-[#fd7f33]"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
