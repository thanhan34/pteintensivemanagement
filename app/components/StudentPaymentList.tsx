'use client';

import { Student } from '../types/student';
import { useState } from 'react';
import TabNavigation from './TabNavigation';
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
  activeTab: 'class' | '2345' | 'one-on-one';
  onTabChange: (tab: 'class' | '2345' | 'one-on-one') => void;
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
  activeTab,
  onTabChange,
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

      <TabNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        type="student"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Student Name</th>
              <th className="px-4 py-2 border">Target Score</th>
              <th className="px-4 py-2 border">Payment Dates</th>
              <th className="px-4 py-2 border">Tuition Fee</th>
              <th className="px-4 py-2 border">Payment Status</th>
              {activeTab === 'one-on-one' && (
                <th className="px-4 py-2 border">Trainer</th>
              )}
              <th className="px-4 py-2 border">Notes</th>
              {activeTab === 'one-on-one' && (
                <th className="px-4 py-2 border">Process Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr 
                key={student.id}
                className={
                  activeTab === 'one-on-one'
                    ? student.isProcess
                      ? 'bg-green-50'
                      : 'bg-red-50'
                    : ''
                }
              >
                <td className="px-4 py-2 border">{student.name}</td>
                <td className="px-4 py-2 border">{student.targetScore}</td>
                <td className="px-4 py-2 border">
                  {student.tuitionPaymentDates.map(date => formatDate(date)).join(', ')}
                </td>
                <td className="px-4 py-2 border">{formatVND(student.tuitionFee)}</td>
                <td className="px-4 py-2 border">{student.tuitionPaymentStatus}</td>
                {activeTab === 'one-on-one' && (
                  <td className="px-4 py-2 border">
                    {student.notes.match(/với\s+([^-\n]+)/)?.[1]?.trim() || ''}
                  </td>
                )}
                <td className="px-4 py-2 border">{student.notes}</td>
                {activeTab === 'one-on-one' && (
                  <td className="px-4 py-2 border">
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
