'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import { collection, query, doc, where, getDoc, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord, User } from '../types/roles';
import { useSettings } from '../hooks/useSettings';

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
    if (!isAdmin) return;
    
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
  }, [isAdmin]);

  const setupAttendanceListener = useCallback(() => {
    if (!session?.user?.id) return;

    try {
      const attendanceRef = collection(db, 'attendance');
      let q;

      if (isAdmin) {
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
  }, [session?.user?.id, isAdmin, selectedTrainerId]);

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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label>Trainer:</label>
              <select
                className="border p-2 rounded"
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
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Approved Hours</h3>
            <p className="text-2xl font-bold text-blue-600">{approvedHours.toFixed(2)} hours</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Pending Hours</h3>
            <p className="text-2xl font-bold text-yellow-600">{pendingHours.toFixed(2)} hours</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Records in Date Range</h3>
            <p className="text-2xl font-bold text-green-600">{filteredRecords.length}</p>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                {isAdmin && !selectedTrainerId && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? (selectedTrainerId ? 7 : 8) : 7} className="px-6 py-4 text-center text-gray-500">
                    No attendance records found in selected date range
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                    {isAdmin && !selectedTrainerId && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trainerNames[record.trainerId] || 'Loading...'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.startTime} - {record.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalHours.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${record.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          record.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.notes || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="space-x-2">
                        {isAdmin && record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(record.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(record.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {((isTrainer && record.trainerId === session.user.id && record.status === 'pending') || isAdmin) && (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
