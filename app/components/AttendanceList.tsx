'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, doc, where, getDoc, updateDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord, User } from '../types/roles';

export default function AttendanceList() {
  const { data: session, status } = useSession();
  const [attendanceRecords, setAttendanceRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<(AttendanceRecord & { id: string })[]>([]);
  const [trainerNames, setTrainerNames] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Date range state
  const currentDate = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTrainerNames = async (trainerIds: string[]) => {
    try {
      const uniqueTrainerIds = [...new Set(trainerIds)];
      const trainersMap: { [key: string]: string } = {};

      for (const trainerId of uniqueTrainerIds) {
        const trainerRef = doc(db, 'users', trainerId);
        const trainerDoc = await getDoc(trainerRef);
        
        if (trainerDoc.exists()) {
          const trainerData = trainerDoc.data() as User;
          trainersMap[trainerId] = trainerData.name;
        } else {
          trainersMap[trainerId] = 'Unknown Trainer';
        }
      }

      setTrainerNames(trainersMap);
    } catch (err) {
      console.error('Error fetching trainer names:', err);
      setError('Failed to fetch trainer names');
    }
  };

  const fetchAttendanceRecords = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const attendanceRef = collection(db, 'attendance');
      let q;

      if (isAdmin) {
        q = query(attendanceRef);
      } else {
        q = query(
          attendanceRef,
          where('trainerId', '==', session.user.id)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (AttendanceRecord & { id: string })[];

      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (isAdmin) {
        await fetchTrainerNames(records.map(record => record.trainerId));
      }

      setAttendanceRecords(records);
      setFilteredRecords(records);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance records');
      setLoading(false);
    }
  }, [session?.user?.id, isAdmin]);

  useEffect(() => {
    if (mounted && session?.user?.id) {
      fetchAttendanceRecords();
    }
  }, [session, mounted, fetchAttendanceRecords]);

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

      await fetchAttendanceRecords();
      alert(`Attendance record ${newStatus} successfully`);
    } catch (err) {
      console.error('Error updating attendance status:', err);
      setError('Failed to update attendance status');
    }
  };

  // Calculate total hours
  const calculateTotalHours = () => {
    return filteredRecords.reduce((total, record) => {
      if (record.status === 'approved') {
        return total + record.totalHours;
      }
      return total;
    }, 0);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total Approved Hours</h3>
            <p className="text-2xl font-bold text-blue-600">{calculateTotalHours().toFixed(2)} hours</p>
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
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-6 py-4 text-center text-gray-500">
                    No attendance records found in selected date range
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                    {isAdmin && (
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
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.status === 'pending' && (
                          <div className="space-x-2">
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
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
