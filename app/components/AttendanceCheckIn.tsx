'use client';

import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord } from '../types/roles';
import { getDateStringInTimezone, getTimeHHmmInTimezone } from '../utils/dateTime';

export default function AttendanceCheckIn() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

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

    const today = getDateStringInTimezone();
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

      const activeSessions = records.filter(record => record.startTime && (!record.endTime || record.endTime === ''));
      const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;
      setCurrentSession(activeSession || null);
      setIsCheckedIn(!!activeSession);
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  // Get user's geolocation
  const getGeolocation = async () => {
    setLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates using reverse geocoding
      let address = '';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      } catch {
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      return { latitude, longitude, address };
    } catch (error) {
      console.error('Error getting location:', error);
      throw new Error('Could not get your location. Please enable location services.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!session?.user?.id) return;

    if (isCheckedIn || currentSession) {
      setError('You already have an active session. Please end it first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const location = await getGeolocation();
      
      const now = new Date();
      const today = getDateStringInTimezone(now);
      const currentTime = getTimeHHmmInTimezone(now);
      const sessionNumber = todayRecords.length + 1;

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
        checkInLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
          timestamp: now.toISOString()
        },
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'attendance'), attendanceData);
      
      alert('✅ Check-in successful!');
    } catch (error) {
      console.error('Error checking in:', error);
      setError(error instanceof Error ? error.message : 'Failed to check in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!session?.user?.id || !currentSession) return;

    setSubmitting(true);
    setError(null);

    try {
      const location = await getGeolocation();
      
      const now = new Date();
      const currentTime = getTimeHHmmInTimezone(now);
      
      const startDateTime = new Date(`${currentSession.date} ${currentSession.startTime}`);
      const endDateTime = new Date(`${currentSession.date} ${currentTime}`);
      const totalHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

      const attendanceRef = doc(db, 'attendance', currentSession.id);
      
      await updateDoc(attendanceRef, {
        endTime: currentTime,
        totalHours: totalHours,
        checkOutLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
          timestamp: now.toISOString()
        }
      });

      alert('✅ Check-out successful!');
    } catch (error) {
      console.error('Error checking out:', error);
      setError(error instanceof Error ? error.message : 'Failed to check out. Please try again.');
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

  const getTodayTotalHours = () => {
    if (todayRecords.length === 0) return 0;
    
    let totalHours = 0;
    todayRecords.forEach(record => {
      if (record.endTime && record.endTime !== '') {
        totalHours += record.totalHours || 0;
      } else if (record.startTime && isCheckedIn && record.id === currentSession?.id) {
        const now = new Date();
        const startDateTime = new Date(`${record.date} ${record.startTime}`);
        totalHours += (now.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      }
    });
    
    return totalHours;
  };

  if (!isClient) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg shadow-md">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {session?.user?.name}! 👋
        </h1>
        <p className="text-gray-600">Check in and out with location tracking</p>
      </div>

      {/* Current Time Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fc5d01] via-[#fd7f33] to-[#ff6b35] text-white rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative p-8 text-center">
          <div className="text-5xl md:text-6xl font-bold mb-3 tracking-tight">
            {currentTime ? formatTime(currentTime) : '--:--:--'}
          </div>
          <div className="text-xl opacity-95 font-medium">
            {currentTime ? formatDate(currentTime) : 'Loading...'}
          </div>
          <div className="mt-4 text-sm opacity-80">
            {isCheckedIn ? '🟢 Currently checked in' : '⏸️ Not checked in'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={handleCheckIn}
          disabled={submitting || isCheckedIn || loadingLocation}
          className={`p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
            isCheckedIn || loadingLocation
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:scale-105 shadow-lg hover:shadow-2xl'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="text-4xl">{loadingLocation ? '⏳' : '📍'}</div>
            <span className="text-2xl">CHECK IN</span>
            <div className="text-sm opacity-90 font-normal">
              {loadingLocation ? 'Getting location...' : 'Record location & time'}
            </div>
          </div>
        </button>

        <button
          onClick={handleCheckOut}
          disabled={submitting || !isCheckedIn || loadingLocation}
          className={`p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform ${
            !isCheckedIn || loadingLocation
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg hover:shadow-2xl'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="text-4xl">{loadingLocation ? '⏳' : '📍'}</div>
            <span className="text-2xl">CHECK OUT</span>
            <div className="text-sm opacity-90 font-normal">
              {loadingLocation ? 'Getting location...' : 'Record location & time'}
            </div>
          </div>
        </button>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">📊</span>
            Today&apos;s Summary
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-[#fedac2] to-[#fdbc94] rounded-xl shadow-md">
              <div className="text-4xl mb-2">⏰</div>
              <div className="text-3xl font-bold text-[#fc5d01] mb-1">
                {getTodayTotalHours().toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Hours</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#fdbc94] to-[#ffac7b] rounded-xl shadow-md">
              <div className="text-4xl mb-2">
                {isCheckedIn ? '🟢' : '⏸️'}
              </div>
              <div className="text-lg font-semibold text-[#fc5d01] mb-1">
                {isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </div>
              <div className="text-sm text-gray-600 font-medium">Current Status</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#ffac7b] to-[#fd7f33] rounded-xl shadow-md">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-3xl font-bold text-[#fc5d01] mb-1">
                {todayRecords.filter(r => r.endTime).length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Completed Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sessions */}
      {todayRecords.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] p-6">
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📋</span>
              Today&apos;s Sessions
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {todayRecords.map((record) => (
              <div
                key={record.id}
                className={`p-4 rounded-xl ${
                  record.id === currentSession?.id 
                    ? 'bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300' 
                    : 'bg-gradient-to-r from-gray-50 to-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {record.id === currentSession?.id ? '🟢' : '✅'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        Session {record.sessionNumber || 1}
                        {record.id === currentSession?.id && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.startTime} - {record.endTime || 'In progress'}
                      </div>
                      {record.checkInLocation && (
                        <div className="text-xs text-blue-600 mt-1">
                          📍 {record.checkInLocation.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#fc5d01]">
                      {record.endTime ? 
                        `${record.totalHours.toFixed(1)}h` : 
                        `${((new Date().getTime() - new Date(`${record.date} ${record.startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)}h`
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
