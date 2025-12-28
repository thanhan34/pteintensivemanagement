'use client';

import { useState, useEffect, useCallback } from 'react';
import { Student } from '../types/student';
import { OperationFee } from '../types/operation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as XLSX from 'xlsx';
import { useSettings } from '../hooks/useSettings';
import { useSession } from 'next-auth/react';
import FilterSection from '../components/FilterSection';
import SummarySection from '../components/SummarySection';
import StudentPaymentList from '../components/StudentPaymentList';
import OperationFeeList from '../components/OperationFeeList';
import AccountanceOperationFeeForm from '../components/AccountanceOperationFeeForm';
import AccountancePendingFees from '../components/AccountancePendingFees';

interface StudentExportData {
  [key: string]: string | number;
  'Student Name': string;
  'Target Score': number;
  'Payment Dates': string;
  'Tuition Fee': number;
  'Payment Status': string;
  'Notes': string;
  'Process Status': string;
}

interface OperationFeeExportData {
  [key: string]: string | number;
  'Trainer Name': string;
  'Amount': number;
  'Date': string;
  'Type': string;
  'Notes': string;
  'Process Status': string;
}

export default function AccountingPage() {
  const { settings } = useSettings();
  const { data: session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [operationFees, setOperationFees] = useState<OperationFee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFeeTerm, setSearchFeeTerm] = useState('');
  const [minTargetScore, setMinTargetScore] = useState<number | ''>('');
  const [maxTargetScore, setMaxTargetScore] = useState<number | ''>('');
  
  // Date range states
  const currentDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(settings.accounting.defaultFromDate || currentDate);
  const [endDate] = useState(currentDate); // Always use current date for end date

  // Sorting states
  const [studentSort, setStudentSort] = useState<'asc' | 'desc'>('asc');
  const [operationSort, setOperationSort] = useState<'asc' | 'desc'>('asc');

  // Update start date when settings change
  useEffect(() => {
    if (settings.accounting.defaultFromDate) {
      setStartDate(settings.accounting.defaultFromDate);
    }
  }, [settings]);

  // Format number to VND
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fetch data function
  const fetchData = useCallback(async () => {
    // Fetch students
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentsData = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
    setStudents(studentsData);

    // Fetch operation fees
    const feesSnapshot = await getDocs(collection(db, 'operationFees'));
    const feesData = feesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as OperationFee[];
    setOperationFees(feesData);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export functions
  const exportToExcel = (data: Record<string, string | number>[], filename: string): void => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${startDate}_to_${endDate}.xlsx`);
  };

  const handleExportStudents = () => {
    const exportData: StudentExportData[] = filteredStudents.map(student => ({
      'Student Name': student.name,
      'Target Score': student.targetScore,
      'Payment Dates': student.tuitionPaymentDates.map(date => formatDate(date)).join(', '),
      'Tuition Fee': student.tuitionFee,
      'Payment Status': student.tuitionPaymentStatus,
      ...(student.type === 'one-on-one' ? {
        'Trainer': student.notes.match(/với\s+([^-\n]+)/)?.[1]?.trim() || ''
      } : {}),
      'Notes': student.notes,
      'Process Status': student.type === 'one-on-one' ? (student.isProcess ? 'Processed' : 'Not Processed') : 'N/A'
    }));
    exportToExcel(exportData, 'student_payments_all');
  };

  const handleExportOperationFees = () => {
    const exportData: OperationFeeExportData[] = filteredFees.map(fee => ({
      'Trainer Name': fee.trainerName,
      'Amount': fee.amount,
      'Date': formatDate(fee.date),
      'Type': fee.type || 'class',
      'Notes': fee.notes,
      'Process Status': fee.type === 'one-on-one' ? (fee.isProcess ? 'Processed' : 'Not Processed') : 'N/A'
    }));
    exportToExcel(exportData, 'operation_fees_all');
  };

  // Date filtering function
  const isWithinDateRange = (date: string): boolean => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
  };

  // Filter students based on search term, date range, and target score
  const filteredStudents = students
    .filter(student =>
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(student => 
      student.tuitionPaymentDates.some(date => isWithinDateRange(date))
    )
    .filter(student => {
      if (minTargetScore !== '' && student.targetScore < minTargetScore) return false;
      if (maxTargetScore !== '' && student.targetScore > maxTargetScore) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.tuitionPaymentDates[0] || '');
      const dateB = new Date(b.tuitionPaymentDates[0] || '');
      return studentSort === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  // Filter operation fees based on search term and date range
  const filteredFees = operationFees
    .filter(fee =>
      (fee.trainerName.toLowerCase().includes(searchFeeTerm.toLowerCase()) ||
      fee.notes.toLowerCase().includes(searchFeeTerm.toLowerCase()))
    )
    .filter(fee => isWithinDateRange(fee.date))
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return operationSort === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  // Calculate totals from filtered data
  const totalTuition = filteredStudents.reduce((sum, student) => sum + (student.tuitionFee || 0), 0);
  const totalOperationFees = filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  const remainingBalance = totalTuition - totalOperationFees;

  const userRole = session?.user?.role;

  // Accountance view - only show form and pending fees
  if (userRole === 'accountance') {
    return (
      <div className="min-h-screen bg-[#fff5ef]">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#fc5d01] mb-2">Quản Lý Chi Phí</h1>
              <p className="text-gray-600">Nhập và theo dõi chi phí hoạt động</p>
            </div>
            
            <div className="space-y-6">
              <AccountanceOperationFeeForm
                currentDate={currentDate}
                onUpdate={fetchData}
              />
              
              <AccountancePendingFees
                operationFees={operationFees}
                formatVND={formatVND}
                formatDate={formatDate}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin and other roles view - show full accounting page
  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <FilterSection
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            minTargetScore={minTargetScore}
            onMinTargetScoreChange={setMinTargetScore}
            maxTargetScore={maxTargetScore}
            onMaxTargetScoreChange={setMaxTargetScore}
          />
          
          <SummarySection
            totalTuition={totalTuition}
            totalOperationFees={totalOperationFees}
            remainingBalance={remainingBalance}
            formatVND={formatVND}
          />
          
          <StudentPaymentList
            students={filteredStudents}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            studentSort={studentSort}
            onSortChange={() => setStudentSort(studentSort === 'asc' ? 'desc' : 'asc')}
            onExport={handleExportStudents}
            formatVND={formatVND}
            formatDate={formatDate}
            onUpdate={fetchData}
          />

          <OperationFeeList
            operationFees={filteredFees}
            searchTerm={searchFeeTerm}
            onSearchChange={setSearchFeeTerm}
            operationSort={operationSort}
            onSortChange={() => setOperationSort(operationSort === 'asc' ? 'desc' : 'asc')}
            onExport={handleExportOperationFees}
            formatVND={formatVND}
            formatDate={formatDate}
            currentDate={currentDate}
            onUpdate={fetchData}
          />
        </div>
      </div>
    </div>
  );
}
