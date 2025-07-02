'use client';

import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { AttendanceRecord } from '../types/roles';

export default function AttendanceForm() {
  const { data: session } = useSession();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default date to today's date
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5); // HH:mm format
    setStartTime(currentTime);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!session?.user?.id) {
      setError('You must be logged in to submit attendance');
      setSubmitting(false);
      return;
    }

    try {
      const startDateTime = new Date(`${date} ${startTime}`);
      const endDateTime = new Date(`${date} ${endTime}`);
      const totalHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

      if (totalHours <= 0) {
        throw new Error('End time must be after start time');
      }

      const attendanceData: Omit<AttendanceRecord, 'id'> = {
        trainerId: session.user.id,
        date,
        startTime,
        endTime,
        totalHours,
        status: 'pending',
        notes: notes || '', // Set empty string as default if notes is empty
        createdBy: session.user.id,
        isBackfill: false,
      };

      // Add attendance record to Firestore
      const docRef = await addDoc(collection(db, 'attendance'), {
        ...attendanceData,
        createdAt: serverTimestamp(),
      });

      console.log('Attendance record created with ID:', docRef.id);

      // Reset form
      setDate(new Date().toISOString().split('T')[0]); // Reset to today's date
      setStartTime(new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5));
      setEndTime('');
      setNotes('');
      setError(null);

      alert('Attendance record submitted successfully!');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setError(error instanceof Error ? error.message : 'Error submitting attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Submit Attendance</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
          Start Time
        </label>
        <input
          type="time"
          id="startTime"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
          End Time
        </label>
        <input
          type="time"
          id="endTime"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Add any additional notes here (optional)"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${submitting 
            ? 'bg-[#fc5d01] cursor-not-allowed' 
            : 'bg-[#fc5d01] hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
      >
        {submitting ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </form>
  );
}
