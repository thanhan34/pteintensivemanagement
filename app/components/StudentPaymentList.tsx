'use client';

import { Student } from '../types/student';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface StudentPaymentListProps {
  students: Student[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  studentSort: 'asc' | 'desc';
  onSortChange: () => void;
  onExport: () => void;
  formatVND: (amount: number) => string;
  formatDate: (date: string) => string;
  onUpdate: () => void;
}

export default function StudentPaymentList({
  students,
  searchTerm,
  onSearchChange,
  studentSort,
  onSortChange,
  onExport,
  formatVND,
  formatDate,
  onUpdate,
}: StudentPaymentListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleProcessToggle = async (student: Student) => {
    if (!student.id || student.type !== 'one-on-one') return;
    
    setProcessingId(student.id);
    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        isProcess: !student.isProcess
      });
      onUpdate(); // Trigger refetch after update
    } catch (error) {
      console.error('Error updating student process status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeColor = (type: Student['type']) => {
    switch (type) {
      case 'class':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '2345':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'one-on-one':
        return 'bg-[#fedac2] text-[#fc5d01] border-[#fdbc94]';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: Student['type']) => {
    switch (type) {
      case 'class':
        return 'Class';
      case '2345':
        return '2345';
      case 'one-on-one':
        return '1-1';
      default:
        return 'Class';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Student Payments</h2>
        <div className="flex gap-4">
          <button
            className="text-sm text-blue-600"
            onClick={onSortChange}
          >
            Sort by Date {studentSort === 'asc' ? '↑' : '↓'}
          </button>
          <input
            type="text"
            placeholder="Search students..."
            className="border p-2 rounded w-64"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={onExport}
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Student Name</th>
              <th className="px-4 py-2 border">Type</th>
              <th className="px-4 py-2 border">Target Score</th>
              <th className="px-4 py-2 border">Payment Dates</th>
              <th className="px-4 py-2 border">Tuition Fee</th>
              <th className="px-4 py-2 border">Payment Status</th>
              <th className="px-4 py-2 border">Trainer</th>
              <th className="px-4 py-2 border">Notes</th>
              <th className="px-4 py-2 border">Process Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr 
                key={student.id}
                className={
                  student.type === 'one-on-one'
                    ? student.isProcess
                      ? 'bg-green-50'
                      : 'bg-red-50'
                    : ''
                }
              >
                <td className="px-4 py-2 border">{student.name}</td>
                <td className="px-4 py-2 border">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getTypeColor(student.type)}`}>
                    {getTypeLabel(student.type)}
                  </span>
                </td>
                <td className="px-4 py-2 border">{student.targetScore}</td>
                <td className="px-4 py-2 border">
                  {student.tuitionPaymentDates.map(date => formatDate(date)).join(', ')}
                </td>
                <td className="px-4 py-2 border">{formatVND(student.tuitionFee)}</td>
                <td className="px-4 py-2 border">{student.tuitionPaymentStatus}</td>
                <td className="px-4 py-2 border">
                  {student.type === 'one-on-one' 
                    ? student.notes.match(/với\s+([^-\n]+)/)?.[1]?.trim() || '-'
                    : '-'
                  }
                </td>
                <td className="px-4 py-2 border">{student.notes}</td>
                <td className="px-4 py-2 border">
                  {student.type === 'one-on-one' ? (
                    <button
                      onClick={() => handleProcessToggle(student)}
                      disabled={processingId === student.id}
                      className={`px-3 py-1 rounded ${
                        student.isProcess
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {processingId === student.id ? 'Processing...' : (student.isProcess ? 'Processed' : 'Not Processed')}
                    </button>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
