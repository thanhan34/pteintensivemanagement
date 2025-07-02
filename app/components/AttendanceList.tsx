'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import { collection, query, doc, where, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord, User } from '../types/roles';
import { useSettings } from '../hooks/useSettings';
import * as XLSX from 'xlsx';

export default function AttendanceList() {
  const { data: session, status } = useSession();
  const { settings } = useSettings();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [trainerNames, setTrainerNames] = useState<{ [key: string]: string }>({});
  const [trainers, setTrainers] = useState<User[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Date range state
  const [startDate, setStartDate] = useState(settings.attendance.defaultFromDate);
  const [endDate, setEndDate] = useState(settings.attendance.defaultToDate);

  const isAdmin = session?.user?.role === 'admin';
  const isTrainer = session?.user?.role === 'trainer';
  const isAdminAssistant = session?.user?.role === 'administrative_assistant';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dates when settings change
  useEffect(() => {
    setStartDate(settings.attendance.defaultFromDate);
    setEndDate(settings.attendance.defaultToDate);
  }, [settings]);

  // Fetch all trainers for admin filter
  const setupTrainersListener = useCallback(() => {
    if (!isAdmin && !isAdminAssistant) return;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'trainer'));
      return onSnapshot(q, (querySnapshot) => {
        const trainersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        setTrainers(trainersData);
        
        // Create trainer names map
        const namesMap: { [key: string]: string } = {};
        trainersData.forEach(trainer => {
          namesMap[trainer.id] = trainer.name;
        });
        setTrainerNames(namesMap);
      }, (err) => {
        console.error('Error fetching trainers:', err);
        setError('Failed to fetch trainers');
      });
    } catch (err) {
      console.error('Error setting up trainers listener:', err);
      setError('Failed to setup trainers listener');
      return undefined;
    }
  }, [isAdmin, isAdminAssistant]);

  const setupAttendanceListener = useCallback(() => {
    if (!session?.user?.id) return;

    try {
      const attendanceRef = collection(db, 'attendance');
      let q;

      if (isAdmin || isAdminAssistant) {
        if (selectedTrainerId) {
          q = query(attendanceRef, where('trainerId', '==', selectedTrainerId));
        } else {
          q = query(attendanceRef);
        }
      } else {
        q = query(
          attendanceRef,
          where('trainerId', '==', session.user.id)
        );
      }
      
      return onSnapshot(q, (querySnapshot) => {
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AttendanceRecord[];

        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setAttendanceRecords(records);
        setLoading(false);
        setError(null);
      }, (err) => {
        console.error('Error details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load attendance records');
        setLoading(false);
      });
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance records');
      setLoading(false);
      return undefined;
    }
  }, [session?.user?.id, isAdmin, isAdminAssistant, selectedTrainerId]);

  useEffect(() => {
    if (mounted && session?.user?.id) {
      const unsubscribeTrainers = setupTrainersListener();
      const unsubscribeAttendance = setupAttendanceListener();

      return () => {
        if (unsubscribeTrainers) unsubscribeTrainers();
        if (unsubscribeAttendance) unsubscribeAttendance();
      };
    }
  }, [session, mounted, setupAttendanceListener, setupTrainersListener]);

  // Filter records when date range changes
  useEffect(() => {
    const filtered = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Include the entire end date
      return recordDate >= start && recordDate <= end;
    });
    setFilteredRecords(filtered);
  }, [attendanceRecords, startDate, endDate]);

  const handleStatusUpdate = async (recordId: string, newStatus: 'approved' | 'rejected') => {
    if (!session?.user?.id || !isAdmin) return;

    try {
      const attendanceRef = doc(db, 'attendance', recordId);
      await updateDoc(attendanceRef, {
        status: newStatus,
        approvedBy: session.user.id,
        approvedAt: new Date().toISOString()
      });

      alert(`Attendance record ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating attendance status:', err);
      setError('Failed to update attendance status');
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!session?.user?.id) return;

    try {
      const attendanceRef = doc(db, 'attendance', recordId);
      const record = await getDoc(attendanceRef);
      
      if (!record.exists()) {
        throw new Error('Record not found');
      }

      const recordData = record.data() as AttendanceRecord;
      
      // Only allow deletion if the record is pending and belongs to the trainer
      if (recordData.trainerId !== session.user.id && !isAdmin) {
        throw new Error('Unauthorized to delete this record');
      }

      if (recordData.status !== 'pending' && !isAdmin) {
        throw new Error('Can only delete pending records');
      }

      if (confirm('Are you sure you want to delete this attendance record?')) {
        await deleteDoc(attendanceRef);
        alert('Attendance record deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting attendance record:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete attendance record');
    }
  };

  const handleEdit = async (record: AttendanceRecord) => {
    if (!session?.user?.id) return;

    if (record.trainerId !== session.user.id && !isAdmin) {
      setError('Unauthorized to edit this record');
      return;
    }

    if (record.status !== 'pending' && !isAdmin) {
      setError('Can only edit pending records');
      return;
    }

    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord || !session?.user?.id) return;

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;
      const notes = formData.get('notes') as string;
      const date = formData.get('date') as string;

      // Calculate total hours
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);
      const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (totalHours <= 0) {
        throw new Error('End time must be after start time');
      }

      const attendanceRef = doc(db, 'attendance', editingRecord.id);
      await updateDoc(attendanceRef, {
        date,
        startTime,
        endTime,
        totalHours,
        notes,
        status: 'pending' // Reset to pending when edited
      });

      setIsEditModalOpen(false);
      setEditingRecord(null);
      alert('Attendance record updated successfully');
    } catch (err) {
      console.error('Error updating attendance record:', err);
      setError(err instanceof Error ? err.message : 'Failed to update attendance record');
    }
  };

  // Calculate total hours for different statuses
  const calculateHours = () => {
    const approvedHours = filteredRecords.reduce((total, record) => {
      if (record.status === 'approved') {
        return total + record.totalHours;
      }
      return total;
    }, 0);

    const pendingHours = filteredRecords.reduce((total, record) => {
      if (record.status === 'pending') {
        return total + record.totalHours;
      }
      return total;
    }, 0);

    return { approvedHours, pendingHours };
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredRecords.map(record => ({
        'Date': record.date,
        'Trainer': trainerNames[record.trainerId] || 'Unknown',
        'Start Time': record.startTime,
        'End Time': record.endTime,
        'Total Hours': record.totalHours.toFixed(2),
        'Type': record.isBackfill ? 'Backfill' : 'Regular',
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
        'Notes': record.notes || '',
        'Backfill Reason': record.backfillReason || '',
        'Created By': record.createdBy === record.trainerId ? 'Trainer' : 'Admin Assistant',
        'Approved By': record.approvedBy || '',
        'Approved At': record.approvedAt || ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // Trainer
        { wch: 12 }, // Start Time
        { wch: 12 }, // End Time
        { wch: 12 }, // Total Hours
        { wch: 10 }, // Type
        { wch: 10 }, // Status
        { wch: 30 }, // Notes
        { wch: 30 }, // Backfill Reason
        { wch: 15 }, // Created By
        { wch: 20 }, // Approved By
        { wch: 20 }  // Approved At
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

      // Generate filename with date range
      const filename = `Attendance_Records_${startDate}_to_${endDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export to Excel. Please try again.');
    }
  };

  if (!mounted) return null;

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Please sign in to view attendance records.</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">Session error. Please try signing in again.</div>
      </div>
    );
  }

  const { approvedHours, pendingHours } = calculateHours();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg shadow-md animate-pulse">
          <div className="flex items-center">
            <span className="text-red-500 mr-2 text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Filters Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">🔍</span>
            Filter & Search
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(isAdmin || isAdminAssistant) && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <span className="mr-2">👤</span>
                  Select Trainer
                </label>
                <select
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#fc5d01] focus:ring-2 focus:ring-[#fc5d01] focus:ring-opacity-20 transition-all duration-200 bg-white shadow-sm"
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                >
                  <option value="">All Trainers</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="mr-2">📅</span>
                From Date
              </label>
              <input
                type="date"
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#fc5d01] focus:ring-2 focus:ring-[#fc5d01] focus:ring-opacity-20 transition-all duration-200 bg-white shadow-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center">
                <span className="mr-2">📅</span>
                To Date
              </label>
              <input
                type="date"
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#fc5d01] focus:ring-2 focus:ring-[#fc5d01] focus:ring-opacity-20 transition-all duration-200 bg-white shadow-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📊</span>
              Summary & Analytics
            </h2>
            {(isAdmin || isAdminAssistant) && filteredRecords.length > 0 && (
              <button
                onClick={handleExportToExcel}
                className="bg-white text-[#fc5d01] px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 hover:bg-gray-100 hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Excel</span>
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">✅</div>
                <div className="text-green-600 text-sm font-medium">APPROVED</div>
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-2">Approved Hours</h3>
              <p className="text-3xl font-bold text-green-600">{approvedHours.toFixed(1)}h</p>
              <div className="text-sm text-green-600 mt-2">Ready for payroll</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">⏳</div>
                <div className="text-yellow-600 text-sm font-medium">PENDING</div>
              </div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Pending Hours</h3>
              <p className="text-3xl font-bold text-yellow-600">{pendingHours.toFixed(1)}h</p>
              <div className="text-sm text-yellow-600 mt-2">Awaiting approval</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📋</div>
                <div className="text-blue-600 text-sm font-medium">TOTAL</div>
              </div>
              <h3 className="text-lg font-bold text-blue-800 mb-2">Total Records</h3>
              <p className="text-3xl font-bold text-blue-600">{filteredRecords.length}</p>
              <div className="text-sm text-blue-600 mt-2">In date range</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Attendance Records */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">📝</span>
            Attendance Records
          </h2>
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-8xl mb-6">📭</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">No Records Found</h3>
            <p className="text-gray-500 mb-6">No attendance records found in the selected date range.</p>
            <div className="text-sm text-gray-400">Try adjusting your date range or filters</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      Date
                    </div>
                  </th>
                  {(isAdmin || isAdminAssistant) && !selectedTrainerId && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        Trainer
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">⏰</span>
                      Time
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">⏱️</span>
                      Hours
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">🏷️</span>
                      Type
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">📊</span>
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">📝</span>
                      Notes
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span className="mr-2">⚙️</span>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr 
                    key={record.id} 
                    className="hover:bg-gradient-to-r hover:from-[#fedac2] hover:to-[#fdbc94] transition-all duration-200 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-xs text-gray-500">{record.date}</div>
                    </td>
                    {(isAdmin || isAdminAssistant) && !selectedTrainerId && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-[#fc5d01] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {(trainerNames[record.trainerId] || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {trainerNames[record.trainerId] || 'Loading...'}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {record.startTime} - {record.endTime || 'In progress'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.endTime ? 'Completed' : 'Ongoing'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-[#fc5d01]">
                        {record.totalHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border-2 ${
                        record.isBackfill 
                          ? 'bg-orange-50 text-orange-800 border-orange-200' 
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {record.isBackfill ? '🔄 Backfill' : '✓ Regular'}
                      </span>
                      {record.isBackfill && record.backfillReason && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs" title={record.backfillReason}>
                          <span className="font-medium">Reason:</span> {record.backfillReason.length > 25 ? record.backfillReason.substring(0, 25) + '...' : record.backfillReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border-2 ${
                        record.status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' : 
                        record.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' : 
                        'bg-yellow-50 text-yellow-800 border-yellow-200'
                      }`}>
                        {record.status === 'approved' ? '✅ Approved' :
                         record.status === 'rejected' ? '❌ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {record.notes ? (
                          <div className="truncate" title={record.notes}>
                            {record.notes}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No notes</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {isAdmin && record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(record.id, 'approved')}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors font-medium"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(record.id, 'rejected')}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {((isTrainer && record.trainerId === session.user.id && record.status === 'pending') || isAdmin) && (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Attendance Record</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingRecord.date}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={editingRecord.startTime}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={editingRecord.endTime}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={editingRecord.notes}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingRecord(null);
                    }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
