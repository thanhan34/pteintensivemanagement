'use client';

import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { useSession } from 'next-auth/react';
import { User } from '../types/roles';

export default function BackfillForm() {
  const { data: session } = useSession();
  const [trainers, setTrainers] = useState<User[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [backfillReason, setBackfillReason] = useState('');
  const [notes, setNotes] = useState('');
  const [activityType, setActivityType] = useState('');
  const [customActivity, setCustomActivity] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trainers
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'trainer'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const trainersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      setTrainers(trainersData);
    });

    return () => unsubscribe();
  }, []);

  // Set max date to today
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const minDate = thirtyDaysAgo.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!session?.user?.id) {
      setError('You must be logged in to submit backfill attendance');
      setSubmitting(false);
      return;
    }

    if (!selectedTrainerId) {
      setError('Please select a trainer');
      setSubmitting(false);
      return;
    }

    if (!activityType) {
      setError('Please select an activity type');
      setSubmitting(false);
      return;
    }

    if (activityType === 'Others' && !customActivity.trim()) {
      setError('Please specify the activity when selecting "Others"');
      setSubmitting(false);
      return;
    }

    if (!backfillReason.trim()) {
      setError('Please provide a reason for the backfill');
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

      // Prepare the final activity text
      const finalActivity = activityType === 'Others' ? customActivity.trim() : activityType;
      const finalNotes = notes.trim() ? `Activity: ${finalActivity}\nNotes: ${notes.trim()}` : `Activity: ${finalActivity}`;

      const attendanceData = {
        trainerId: selectedTrainerId,
        date,
        startTime,
        endTime,
        totalHours,
        status: 'pending' as const,
        notes: finalNotes,
        activityType: finalActivity,
        createdBy: session.user.id,
        isBackfill: true,
        backfillReason: backfillReason.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'attendance'), attendanceData);

      // Reset form
      setSelectedTrainerId('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setActivityType('');
      setCustomActivity('');
      setBackfillReason('');
      setNotes('');
      setError(null);

      alert('Backfill attendance record submitted successfully! It will need admin approval.');
    } catch (error) {
      console.error('Error submitting backfill attendance:', error);
      setError(error instanceof Error ? error.message : 'Error submitting backfill attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-[#fedac2]">
      <h2 className="text-2xl font-bold text-[#fc5d01] mb-6">Create Backfill Attendance</h2>
      <p className="text-sm text-gray-600 mb-6">
        Create attendance records for trainers who missed checking in. All backfill records require admin approval.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trainer" className="block text-sm font-medium text-gray-700 mb-1">
            Select Trainer *
          </label>
          <select
            id="trainer"
            value={selectedTrainerId}
            onChange={(e) => setSelectedTrainerId(e.target.value)}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
          >
            <option value="">Choose a trainer...</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name} ({trainer.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={minDate}
            max={today}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can only create backfill records for the last 30 days
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
            Activity Type *
          </label>
          <select
            id="activityType"
            value={activityType}
            onChange={(e) => {
              setActivityType(e.target.value);
              if (e.target.value !== 'Others') {
                setCustomActivity('');
              }
            }}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
          >
            <option value="">Select activity type...</option>
            <option value="Reading">📚 Reading</option>
            <option value="Support Speaking">🗣️ Support Speaking</option>
            <option value="Others">✏️ Others</option>
          </select>
        </div>

        {activityType === 'Others' && (
          <div>
            <label htmlFor="customActivity" className="block text-sm font-medium text-gray-700 mb-1">
              Specify Activity *
            </label>
            <input
              type="text"
              id="customActivity"
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value)}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
              placeholder="Please specify the activity..."
            />
          </div>
        )}

        <div>
          <label htmlFor="backfillReason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Backfill *
          </label>
          <textarea
            id="backfillReason"
            value={backfillReason}
            onChange={(e) => setBackfillReason(e.target.value)}
            rows={3}
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
            placeholder="Please explain why this backfill attendance is needed (e.g., trainer forgot to check in, system was down, etc.)"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#fc5d01] focus:ring-[#fc5d01] p-3"
            placeholder="Any additional information or context"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-600 text-lg mr-2">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> All backfill attendance records require admin approval before they are counted towards trainer hours.
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 ${
            submitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#fc5d01] hover:bg-[#fd7f33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fc5d01] active:scale-95'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Backfill Attendance'}
        </button>
      </form>
    </div>
  );
}
