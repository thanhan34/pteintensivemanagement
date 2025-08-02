'use client';

import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord } from '../types/roles';

export default function TrainerDashboard() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [activityType, setActivityType] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  // Update current time every second
  useEffect(() => {
    if (!isClient) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isClient]);

  // Listen to today's attendance records
  useEffect(() => {
    if (!session?.user?.id) return;

    const today = new Date().toISOString().split('T')[0];
    const attendanceRef = collection(db, 'attendance');
    const q = query(
      attendanceRef,
      where('trainerId', '==', session.user.id),
      where('date', '==', today),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];

      setTodayRecords(records);

      // Find current active session (checked in but not checked out)
      // Get the most recent session that hasn't been ended yet
      const activeSessions = records.filter(record => record.startTime && (!record.endTime || record.endTime === ''));
      const activeSession = activeSessions.length > 0 ? activeSessions[0] : null; // records are already ordered by createdAt desc
      setCurrentSession(activeSession || null);
      setIsCheckedIn(!!activeSession);
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
      orderBy('createdAt', 'desc'),
      limit(10)
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

  const getNextSessionNumber = () => {
    if (todayRecords.length === 0) return 1;
    // Only count sessions that have been properly created (have sessionNumber)
    const validSessions = todayRecords.filter(record => record.sessionNumber);
    if (validSessions.length === 0) return 1;
    const maxSession = Math.max(...validSessions.map(record => record.sessionNumber || 1));
    return maxSession + 1;
  };

  const handleCheckIn = async () => {
    if (!session?.user?.id) return;

    // Double check to prevent multiple active sessions
    if (isCheckedIn || currentSession) {
      setError('You already have an active session. Please end it first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
      const sessionNumber = getNextSessionNumber();

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
        sessionNumber: sessionNumber,
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
    if (!session?.user?.id || !currentSession) return;

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
      
      const startDateTime = new Date(`${currentSession.date} ${currentSession.startTime}`);
      const endDateTime = new Date(`${currentSession.date} ${currentTime}`);
      const totalHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

      // Prepare the final activity text
      const finalActivity = activityType === 'Others' ? customActivity.trim() : activityType;

      const { updateDoc, doc } = await import('firebase/firestore');
      const attendanceRef = doc(db, 'attendance', currentSession.id);
      
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
    if (!session?.user?.id || !currentSession) return;

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
      const attendanceRef = doc(db, 'attendance', currentSession.id);
      
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
    if (todayRecords.length === 0) return 'Not started';
    if (isCheckedIn) return 'In Progress';
    return 'Completed sessions';
  };

  const getTodayTotalHours = () => {
    if (todayRecords.length === 0) return 0;
    
    let totalHours = 0;
    todayRecords.forEach(record => {
      if (record.endTime && record.endTime !== '') {
        totalHours += record.totalHours || 0;
      } else if (record.startTime && isCheckedIn && record.id === currentSession?.id) {
        // Calculate current session hours
        const now = new Date();
        const startDateTime = new Date(`${record.date} ${record.startTime}`);
        totalHours += (now.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      }
    });
    
    return totalHours;
  };

  const getCompletedSessions = () => {
    return todayRecords.filter(record => record.endTime && record.endTime !== '').length;
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
            {currentTime ? formatTime(currentTime) : '--:--:--'}
          </div>
          <div className="text-xl opacity-95 font-medium">
            {currentTime ? formatDate(currentTime) : 'Loading...'}
          </div>
          <div className="mt-4 text-sm opacity-80">
            {isCheckedIn ? `🟢 Session ${currentSession?.sessionNumber || 1} in progress` : '⏸️ Ready for next session'}
          </div>
        </div>
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <button
            onClick={handleCheckIn}
            disabled={submitting || isCheckedIn}
            className={`w-full p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
              isCheckedIn
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-2xl active:scale-95'
            }`}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="text-4xl">
                {submitting ? '⏳' : '🚀'}
              </div>
              <span className="text-2xl">
                {todayRecords.length === 0 ? 'CHECK IN' : `START SESSION ${getNextSessionNumber()}`}
              </span>
              <div className="text-sm opacity-90 font-normal">
                {submitting ? 'Processing...' : 
                 todayRecords.length === 0 ? 'Start your productive day' : 'Begin a new work session'}
              </div>
            </div>
          </button>
          {!isCheckedIn && (
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
              <span className="text-2xl">
                {currentSession ? `END SESSION ${currentSession.sessionNumber}` : 'CHECK OUT'}
              </span>
              <div className="text-sm opacity-90 font-normal">
                {submitting ? 'Processing...' : 'Complete current session'}
              </div>
            </div>
          </button>
          {isCheckedIn && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {isCheckedIn && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📝</span>
              Add Notes for Current Session
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
              
              {showNotesInput ? (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCheckOut}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '⏳ Processing...' : '🏁 End Session Now'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNotesInput(false);
                      setActivityType('');
                      setCustomActivity('');
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-[#fedac2] to-[#fdbc94] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-3xl font-bold text-[#fc5d01] mb-1">
                {getTodayTotalHours().toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Hours</div>
              <div className="mt-2 text-xs text-gray-500">
                {isCheckedIn ? 'Still counting...' : 'Completed'}
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#fdbc94] to-[#ffac7b] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">
                {getTodayStatus() === 'In Progress' ? '🔥' : 
                 getTodayStatus() === 'Completed sessions' ? '✅' : '💤'}
              </div>
              <div className="text-lg font-semibold text-[#fc5d01] mb-1">
                {getTodayStatus()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Current Status</div>
              <div className="mt-2 text-xs text-gray-500">
                {isCheckedIn ? 'Keep going!' : 'Ready for next session?'}
              </div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#ffac7b] to-[#fd7f33] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">📈</div>
              <div className="text-3xl font-bold text-[#fc5d01] mb-1">
                {getCompletedSessions()}
              </div>
              <div className="text-sm text-gray-600 font-medium">Completed Sessions</div>
              <div className="mt-2 text-xs text-gray-500">
                {isCheckedIn ? `+ 1 in progress` : 'Today'}
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-[#fd7f33] to-[#fc5d01] rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-2">🕐</div>
              <div className="text-lg font-semibold text-white mb-1">
                {currentSession?.startTime || '--:--'}
              </div>
              <div className="text-sm text-white font-medium opacity-90">Current Session</div>
              <div className="mt-2 text-xs text-white opacity-75">
                {currentSession ? `Session ${currentSession.sessionNumber}` : 'Not started'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sessions */}
      {todayRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📅</span>
              Today&apos;s Sessions
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {todayRecords.map((record, index) => (
                <div
                  key={record.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 transform hover:scale-102 shadow-sm hover:shadow-md ${
                    record.id === currentSession?.id 
                      ? 'bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#fedac2] hover:to-[#fdbc94]'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {record.id === currentSession?.id ? '🔥' : getStatusIcon(record.status)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-lg flex items-center space-x-2">
                        <span>Session {record.sessionNumber || 1}</span>
                        {record.id === currentSession?.id && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.startTime} - {record.endTime || 'In progress'}
                      </div>
                      {record.activityType && (
                        <div className="text-xs text-blue-600 font-medium">
                          📋 {record.activityType}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#fc5d01] mb-1">
                      {record.endTime ? 
                        `${Math.round(record.totalHours * 60)}m` : 
                        `${Math.round(((new Date().getTime() - new Date(`${record.date} ${record.startTime}`).getTime()) / (1000 * 60)))}m`
                      }
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
          </div>
        </div>
      )}

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
              {recentRecords.slice(0, 5).map((record, index) => (
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
                      <div className="font-semibold text-gray-800 text-lg flex items-center space-x-2">
                        <span>
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="text-sm text-gray-500">
                          Session {record.sessionNumber || 1}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.startTime} - {record.endTime || 'In progress'}
                      </div>
                      {record.activityType && (
                        <div className="text-xs text-blue-600 font-medium">
                          📋 {record.activityType}
                        </div>
                      )}
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
          {isCheckedIn ? '💪 Keep up the great work!' : '🌟 Ready to start a new session?'}
        </div>
        <div className="text-gray-600">
          {isCheckedIn 
            ? `Session ${currentSession?.sessionNumber} - ${((new Date().getTime() - new Date(`${currentSession?.date} ${currentSession?.startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours so far`
            : `You've completed ${getCompletedSessions()} sessions today (${getTodayTotalHours().toFixed(1)} hours total)`}
        </div>
      </div>
    </div>
  );
}
