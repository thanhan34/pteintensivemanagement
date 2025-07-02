'use client';

import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord } from '../types/roles';

export default function TrainerDashboard() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [activityType, setActivityType] = useState('');
  const [customActivity, setCustomActivity] = useState('');

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen to today's attendance record
  useEffect(() => {
    if (!session?.user?.id) return;

    const today = new Date().toISOString().split('T')[0];
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('trainerId', '==', session.user.id),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];

      if (records.length > 0) {
        const record = records[0];
        setTodayRecord(record);
        setIsCheckedIn(!!record.startTime && (!record.endTime || record.endTime === ''));
      } else {
        setTodayRecord(null);
        setIsCheckedIn(false);
      }
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  // Listen to recent attendance records
  useEffect(() => {
    if (!session?.user?.id) return;

    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('trainerId', '==', session.user.id),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];

      setRecentRecords(records);
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  const handleCheckIn = async () => {
    if (!session?.user?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);

      const attendanceData = {
        trainerId: session.user.id,
        date: today,
        startTime: currentTime,
        endTime: '',
        totalHours: 0,
        status: 'pending' as const,
        notes: '',
        createdBy: session.user.id,
        isBackfill: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'attendance'), attendanceData);
    } catch (error) {
      console.error('Error checking in:', error);
      setError('Failed to check in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!session?.user?.id || !todayRecord) return;

    // Validate required fields
    if (!activityType) {
      setError('Please select an activity type before checking out.');
      return;
    }

    if (activityType === 'Others' && !customActivity.trim()) {
      setError('Please specify the activity when selecting "Others".');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
      
      const startDateTime = new Date(`${todayRecord.date} ${todayRecord.startTime}`);
      const endDateTime = new Date(`${todayRecord.date} ${currentTime}`);
      const totalHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

      // Prepare the final activity text
      const finalActivity = activityType === 'Others' ? customActivity.trim() : activityType;

      const { updateDoc, doc } = await import('firebase/firestore');
      const attendanceRef = doc(db, 'attendance', todayRecord.id);
      
      await updateDoc(attendanceRef, {
        endTime: currentTime,
        totalHours: totalHours,
        notes: `Activity: ${finalActivity}`,
        activityType: finalActivity,
      });

      // Reset all fields and hide input
      setActivityType('');
      setCustomActivity('');
      setShowNotesInput(false);
    } catch (error) {
      console.error('Error checking out:', error);
      setError('Failed to check out. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!session?.user?.id || !todayRecord) return;

    // Validate required fields
    if (!activityType) {
      setError('Please select an activity type.');
      return;
    }

    if (activityType === 'Others' && !customActivity.trim()) {
      setError('Please specify the activity when selecting "Others".');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const attendanceRef = doc(db, 'attendance', todayRecord.id);
      
      // Prepare the final activity text
      const finalActivity = activityType === 'Others' ? customActivity.trim() : activityType;
      
      await updateDoc(attendanceRef, {
        notes: `Activity: ${finalActivity}`,
        activityType: finalActivity,
      });

      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error updating notes:', error);
      setError('Failed to save notes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const getTodayStatus = () => {
    if (!todayRecord) return 'Not started';
    if (isCheckedIn) return 'In Progress';
    if (todayRecord.endTime) return 'Completed';
    return 'Checked In';
  };

  const getTodayHours = () => {
    if (!todayRecord) return 0;
    if (!todayRecord.endTime && todayRecord.startTime) {
      const now = new Date();
      const startDateTime = new Date(`${todayRecord.date} ${todayRecord.startTime}`);
      return (now.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    }
    return todayRecord.totalHours || 0;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg shadow-md animate-pulse">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {session?.user?.name || 'Trainer'}! 👋
        </h1>
        <p className="text-gray-600">Ready to track your attendance today?</p>
      </div>

      {/* Current Time & Date Card - Enhanced */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fc5d01] via-[#fd7f33] to-[#ff6b35] text-white rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
        <div className="relative p-8 text-center">
          <div className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-xl opacity-95 font-medium">
            {formatDate(currentTime)}
          </div>
          <div className="mt-4 text-sm opacity-80">
            {isCheckedIn ? '🟢 Currently working' : '⏸️ Not checked in'}
          </div>
        </div>
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <button
            onClick={handleCheckIn}
            disabled={submitting || isCheckedIn || (todayRecord ? !!todayRecord.endTime : false)}
            className={`w-full p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
              isCheckedIn || (todayRecord && todayRecord.endTime)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="text-4xl">
                {submitting ? '⏳' : '🚀'}
              </div>
              <span className="text-2xl">CHECK IN</span>
              <div className="text-sm opacity-90 font-normal">
                {submitting ? 'Processing...' : 'Start your productive day'}
              </div>
            </div>
          </button>
          {!isCheckedIn && !todayRecord?.endTime && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>

        <div className="relative group">
          <button
            onClick={() => setShowNotesInput(!showNotesInput)}
            disabled={submitting || !isCheckedIn}
            className={`w-full p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
              !isCheckedIn
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="text-4xl">
                {submitting ? '⏳' : '🏁'}
              </div>
              <span className="text-2xl">CHECK OUT</span>
              <div className="text-sm opacity-90 font-normal">
                {submitting ? 'Processing...' : 'Complete your day'}
              </div>
            </div>
          </button>
          {isCheckedIn && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {(showNotesInput || isCheckedIn) && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📝</span>
              Add Notes for Today
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  value={activityType}
                  onChange={(e) => {
                    setActivityType(e.target.value);
                    if (e.target.value !== 'Others') {
                      setCustomActivity('');
                    }
                  }}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#fc5d01] focus:ring-2 focus:ring-[#fc5d01] focus:ring-opacity-20 transition-all duration-200 bg-white shadow-sm"
                  required
                >
                  <option value="">Select activity type...</option>
                  <option value="Reading">📚 Reading</option>
                  <option value="Support Speaking">🗣️ Support Speaking</option>
                  <option value="Others">✏️ Others</option>
                </select>
              </div>

              {activityType === 'Others' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specify Activity *
                  </label>
                  <input
                    type="text"
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    placeholder="Please specify the activity..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#fc5d01] focus:ring-2 focus:ring-[#fc5d01] focus:ring-opacity-20 transition-all duration-200 bg-white shadow-sm"
                    required
                  />
                </div>
              )}
              
              {showNotesInput && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCheckOut}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '⏳ Processing...' : '🏁 Check Out Now'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNotesInput(false);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {isCheckedIn && !showNotesInput && (
                <button
                  onClick={() => handleUpdateNotes()}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Saving...' : '💾 Save Notes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Summary - Enhanced */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">📊</span>
            Today&apos;s Performance
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-[#fedac2] to-[#fdbc94] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-3xl font-bold text-[#fc5d01] mb-1">
                {getTodayHours().toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Hours</div>
              <div className="mt-2 text-xs text-gray-500">
                {isCheckedIn ? 'Still counting...' : 'Completed'}
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#fdbc94] to-[#ffac7b] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">
                {getTodayStatus() === 'In Progress' ? '🔥' : 
                 getTodayStatus() === 'Completed' ? '✅' : '💤'}
              </div>
              <div className="text-lg font-semibold text-[#fc5d01] mb-1">
                {getTodayStatus()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Current Status</div>
              <div className="mt-2 text-xs text-gray-500">
                {isCheckedIn ? 'Keep going!' : 'Ready to start?'}
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#ffac7b] to-[#fd7f33] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🕐</div>
              <div className="text-lg font-semibold text-[#fc5d01] mb-1">
                {todayRecord?.startTime || '--:--'}
              </div>
              <div className="text-sm text-gray-600 font-medium">Start Time</div>
              <div className="mt-2 text-xs text-gray-500">
                {todayRecord?.startTime ? 'Started today' : 'Not started yet'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities - Enhanced */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">📈</span>
            Recent Activities
          </h3>
        </div>
        <div className="p-6">
          {recentRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl text-gray-500 mb-2">No activities yet</div>
              <div className="text-sm text-gray-400">Your attendance records will appear here</div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecords.map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-[#fedac2] hover:to-[#fdbc94] transition-all duration-300 transform hover:scale-102 shadow-sm hover:shadow-md"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.startTime} - {record.endTime || 'In progress'}
                      </div>
                      {record.isBackfill && (
                        <div className="text-xs text-orange-600 font-medium">
                          🔄 Backfill Record
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#fc5d01] mb-1">
                      {record.totalHours.toFixed(1)}h
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      record.status === 'approved' ? 'bg-green-100 text-green-800' :
                      record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="text-center py-6">
        <div className="text-2xl mb-2">
          {isCheckedIn ? '💪 Keep up the great work!' : '🌟 Ready to make today productive?'}
        </div>
        <div className="text-gray-600">
          {isCheckedIn 
            ? `You&apos;ve been working for ${getTodayHours().toFixed(1)} hours today`
            : 'Click Check In to start tracking your time'}
        </div>
      </div>
    </div>
  );
}
