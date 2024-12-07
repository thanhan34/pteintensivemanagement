'use client';

import { useState, useEffect } from 'react';
import { Student } from '../types/student';
import { OperationFee, OperationFeeInput } from '../types/operation';
import { collection, getDocs, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as XLSX from 'xlsx';
import { useSettings } from '../hooks/useSettings';

interface StudentExportData {
  [key: string]: string | number;
  'Student Name': string;
  'Target Score': number;
  'Payment Dates': string;
  'Tuition Fee': number;
  'Payment Status': string;
  'Notes': string;
}

interface OperationFeeExportData {
  [key: string]: string | number;
  'Trainer Name': string;
  'Amount': number;
  'Date': string;
  'Type': string;
  'Notes': string;
}

type StudentType = 'one-on-one' | 'class' | '2345';

export default function AccountingPage() {
  const { settings } = useSettings();
  const [students, setStudents] = useState<Student[]>([]);
  const [operationFees, setOperationFees] = useState<OperationFee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFeeTerm, setSearchFeeTerm] = useState('');
  const [minTargetScore, setMinTargetScore] = useState<number | ''>('');
  const [maxTargetScore, setMaxTargetScore] = useState<number | ''>('');
  const [activeFeeTab, setActiveFeeTab] = useState<StudentType>('class');
  
  // Date range states
  const currentDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(settings.accounting.defaultFromDate || currentDate);
  const [endDate] = useState(currentDate); // Always use current date for end date
  
  const [newFee, setNewFee] = useState<OperationFeeInput>({
    trainerName: '',
    amount: 0,
    date: currentDate,
    notes: '',
    type: 'class'
  });

  // Edit mode states
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OperationFeeInput>({
    trainerName: '',
    amount: 0,
    date: currentDate,
    notes: '',
    type: 'class'
  });

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

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, []);

  const handleAddFee = async () => {
    try {
      const feeData = {
        ...newFee,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'operationFees'), feeData);
      
      const newOperationFee: OperationFee = {
        ...newFee,
        id: docRef.id,
        createdAt: new Date().toISOString()
      };

      setOperationFees([...operationFees, newOperationFee]);
      setNewFee({
        trainerName: '',
        amount: 0,
        date: currentDate,
        notes: '',
        type: activeFeeTab
      });
    } catch (error) {
      console.error('Error adding operation fee:', error);
    }
  };

  const handleEditFee = (fee: OperationFee) => {
    if (!fee.id) return;
    setEditingFee(fee.id);
    setEditForm({
      trainerName: fee.trainerName,
      amount: fee.amount,
      date: fee.date,
      notes: fee.notes,
      type: fee.type || 'class'
    });
  };

  const handleUpdateFee = async () => {
    if (!editingFee) return;

    try {
      const feeRef = doc(db, 'operationFees', editingFee);
      await updateDoc(feeRef, editForm);

      setOperationFees(operationFees.map(fee => 
        fee.id === editingFee ? { ...fee, ...editForm } : fee
      ));

      setEditingFee(null);
    } catch (error) {
      console.error('Error updating operation fee:', error);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this operation fee?')) return;

    try {
      await deleteDoc(doc(db, 'operationFees', id));
      setOperationFees(operationFees.filter(fee => fee.id !== id));
    } catch (error) {
      console.error('Error deleting operation fee:', error);
    }
  };

  // Export functions
  const exportToExcel = <T extends Record<string, string | number>>(data: T[], filename: string): void => {
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
      'Notes': student.notes
    }));
    exportToExcel(exportData, `student_payments_${activeFeeTab}`);
  };

  const handleExportOperationFees = () => {
    const exportData: OperationFeeExportData[] = filteredFees.map(fee => ({
      'Trainer Name': fee.trainerName,
      'Amount': fee.amount,
      'Date': formatDate(fee.date),
      'Type': fee.type || 'class',
      'Notes': fee.notes
    }));
    exportToExcel(exportData, `operation_fees_${activeFeeTab}`);
  };

  // Date filtering function
  const isWithinDateRange = (date: string): boolean => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
  };

  // Filter students based on search term, date range, target score, and type
  const filteredStudents = students
    .filter(student =>
      (student.type || 'class') === activeFeeTab && // Filter by type
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

  // Filter operation fees based on search term, date range, and type
  const filteredFees = operationFees
    .filter(fee =>
      (fee.type || 'class') === activeFeeTab && // Filter by type
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

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters Section */}
          <div className="mb-6 space-y-4">
            {/* Date Range Filter */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label>From:</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label>To:</label>
                <input
                  type="date"
                  className="border p-2 rounded"
                  value={endDate}
                  disabled
                />
              </div>
            </div>

            {/* Target Score Filter */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label>Min Target Score:</label>
                <input
                  type="number"
                  className="border p-2 rounded w-24"
                  value={minTargetScore}
                  onChange={(e) => setMinTargetScore(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Min"
                />
              </div>
              <div className="flex items-center gap-2">
                <label>Max Target Score:</label>
                <input
                  type="number"
                  className="border p-2 rounded w-24"
                  value={maxTargetScore}
                  onChange={(e) => setMaxTargetScore(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          
          {/* Summary Section */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Total Tuition</h3>
              <p className="text-2xl font-bold text-blue-600">{formatVND(totalTuition)}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Total Operation Fees</h3>
              <p className="text-2xl font-bold text-red-600">{formatVND(totalOperationFees)}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Remaining Balance</h3>
              <p className="text-2xl font-bold text-green-600">{formatVND(remainingBalance)}</p>
            </div>
          </div>
          
          {/* Student Payments Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Student Payments</h2>
              <div className="flex gap-4">
                <button
                  className="text-sm text-blue-600"
                  onClick={() => setStudentSort(studentSort === 'asc' ? 'desc' : 'asc')}
                >
                  Sort by Date {studentSort === 'asc' ? '↑' : '↓'}
                </button>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="border p-2 rounded w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={handleExportStudents}
                >
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Student Type Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveFeeTab('class')}
                  className={`${
                    activeFeeTab === 'class'
                      ? 'border-[#fc5d01] text-[#fc5d01]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Class Students
                </button>
                <button
                  onClick={() => setActiveFeeTab('2345')}
                  className={`${
                    activeFeeTab === '2345'
                      ? 'border-[#fc5d01] text-[#fc5d01]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  2345 Students
                </button>
                <button
                  onClick={() => setActiveFeeTab('one-on-one')}
                  className={`${
                    activeFeeTab === 'one-on-one'
                      ? 'border-[#fc5d01] text-[#fc5d01]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  1-1 Students
                </button>
              </nav>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Student Name</th>
                    <th className="px-4 py-2 border">Target Score</th>
                    <th className="px-4 py-2 border">Payment Dates</th>
                    <th className="px-4 py-2 border">Tuition Fee</th>
                    <th className="px-4 py-2 border">Payment Status</th>
                    <th className="px-4 py-2 border">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-2 border">{student.name}</td>
                      <td className="px-4 py-2 border">{student.targetScore}</td>
                      <td className="px-4 py-2 border">
                        {student.tuitionPaymentDates.map(date => formatDate(date)).join(', ')}
                      </td>
                      <td className="px-4 py-2 border">{formatVND(student.tuitionFee)}</td>
                      <td className="px-4 py-2 border">{student.tuitionPaymentStatus}</td>
                      <td className="px-4 py-2 border">{student.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operation Fees Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Operation Fees</h2>
              <div className="flex gap-4">
                <button
                  className="text-sm text-blue-600"
                  onClick={() => setOperationSort(operationSort === 'asc' ? 'desc' : 'asc')}
                >
                  Sort by Date {operationSort === 'asc' ? '↑' : '↓'}
                </button>
                <input
                  type="text"
                  placeholder="Search operation fees..."
                  className="border p-2 rounded w-64"
                  value={searchFeeTerm}
                  onChange={(e) => setSearchFeeTerm(e.target.value)}
                />
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={handleExportOperationFees}
                >
                  Export to Excel
                </button>
              </div>
            </div>

            {/* Operation Fee Type Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => {
                    setActiveFeeTab('class');
                    setNewFee(prev => ({ ...prev, type: 'class' }));
                  }}
                  className={`${
                    activeFeeTab === 'class'
                      ? 'border-[#fc5d01] text-[#fc5d01]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Class Fees
                </button>
                <button
                  onClick={() => {
                    setActiveFeeTab('2345');
                    setNewFee(prev => ({ ...prev, type: '2345' }));
                  }}
                  className={`${
                    activeFeeTab === '2345'
                      ? 'border-[#fc5d01] text-[#fc5d01]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  2345 Fees
                </button>
                <button
                  onClick={() => {
                    setActiveFeeTab('one-on-one');
                    setNewFee(prev => ({ ...prev, type: 'one-on-one' }));
                  }}
                  className={`${
                    activeFeeTab === 'one-on-one'
                      ? 'border-[#fc5d01] text-[#fc5d01]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  1-1 Fees
                </button>
              </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Trainer Name"
                className="border p-2 rounded"
                value={newFee.trainerName}
                onChange={(e) => setNewFee({...newFee, trainerName: e.target.value})}
              />
              <input
                type="number"
                placeholder="Amount (VND)"
                className="border p-2 rounded"
                value={newFee.amount}
                onChange={(e) => setNewFee({...newFee, amount: Number(e.target.value)})}
              />
              <input
                type="date"
                className="border p-2 rounded"
                value={newFee.date}
                onChange={(e) => setNewFee({...newFee, date: e.target.value})}
              />
              <select
                className="border p-2 rounded"
                value={newFee.type}
                onChange={(e) => setNewFee({...newFee, type: e.target.value as StudentType})}
              >
                <option value="class">Class Fee</option>
                <option value="2345">2345 Fee</option>
                <option value="one-on-one">1-1 Fee</option>
              </select>
              <input
                type="text"
                placeholder="Notes"
                className="border p-2 rounded md:col-span-2"
                value={newFee.notes}
                onChange={(e) => setNewFee({...newFee, notes: e.target.value})}
              />
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={handleAddFee}
            >
              Add Operation Fee
            </button>

            {/* Operation Fees Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Trainer Name</th>
                    <th className="px-4 py-2 border">Amount</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Type</th>
                    <th className="px-4 py-2 border">Notes</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => (
                    <tr key={fee.id}>
                      <td className="px-4 py-2 border">
                        {editingFee === fee.id ? (
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={editForm.trainerName}
                            onChange={(e) => setEditForm({...editForm, trainerName: e.target.value})}
                          />
                        ) : fee.trainerName}
                      </td>
                      <td className="px-4 py-2 border">
                        {editingFee === fee.id ? (
                          <input
                            type="number"
                            className="w-full p-1 border rounded"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: Number(e.target.value)})}
                          />
                        ) : formatVND(fee.amount)}
                      </td>
                      <td className="px-4 py-2 border">
                        {editingFee === fee.id ? (
                          <input
                            type="date"
                            className="w-full p-1 border rounded"
                            value={editForm.date}
                            onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                          />
                        ) : formatDate(fee.date)}
                      </td>
                      <td className="px-4 py-2 border">
                        {editingFee === fee.id ? (
                          <select
                            className="w-full p-1 border rounded"
                            value={editForm.type}
                            onChange={(e) => setEditForm({...editForm, type: e.target.value as StudentType})}
                          >
                            <option value="class">Class Fee</option>
                            <option value="2345">2345 Fee</option>
                            <option value="one-on-one">1-1 Fee</option>
                          </select>
                        ) : fee.type === 'class' ? 'Class Fee' :
                           fee.type === '2345' ? '2345 Fee' :
                           fee.type === 'one-on-one' ? '1-1 Fee' : 'Class Fee'}
                      </td>
                      <td className="px-4 py-2 border">
                        {editingFee === fee.id ? (
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={editForm.notes}
                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                          />
                        ) : fee.notes}
                      </td>
                      <td className="px-4 py-2 border">
                        {editingFee === fee.id ? (
                          <div className="flex gap-2">
                            <button
                              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              onClick={handleUpdateFee}
                            >
                              Save
                            </button>
                            <button
                              className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                              onClick={() => setEditingFee(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              onClick={() => fee.id && handleEditFee(fee)}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              onClick={() => fee.id && handleDeleteFee(fee.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
