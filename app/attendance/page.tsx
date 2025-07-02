'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AttendanceList from '../components/AttendanceList';
import TrainerDashboard from '../components/TrainerDashboard';
import BackfillForm from '../components/BackfillForm';

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<'trainer' | 'admin' | 'administrative_assistant' | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        try {
          const userRef = doc(db, 'users', session.user.id);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserRole(userSnap.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setLoading(false);
    };

    if (mounted && status === 'authenticated') {
      fetchUserRole();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status, mounted]);

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">Please sign in to access this page</div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-500">Access denied. No role assigned.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-[#fc5d01]">
        {userRole === 'admin' ? 'Attendance Management' : 
         userRole === 'administrative_assistant' ? 'Attendance & Backfill Management' : 
         'My Attendance'}
      </h1>

      {userRole === 'trainer' && (
        <div className="space-y-8">
          <TrainerDashboard />
          <AttendanceList />
        </div>
      )}

      {userRole === 'administrative_assistant' && (
        <div className="space-y-8">
          <BackfillForm />
          <AttendanceList />
        </div>
      )}

      {userRole === 'admin' && (
        <AttendanceList />
      )}
    </div>
  );
}
