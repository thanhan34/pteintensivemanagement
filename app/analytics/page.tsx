'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Student } from '../types/student';
import AnalyticsCharts from '../components/AnalyticsCharts';

export default function Analytics() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const isAdmin = session?.user?.role === 'admin';

  // Fetch students only for admin users
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(collection(db, 'students'), orderBy('startDate', 'desc'));
        const querySnapshot = await getDocs(q);
        const studentData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Student[];
        setStudents(studentData);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && isAdmin) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [status, isAdmin]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredStudents = students.filter(student => {
    const studentDate = new Date(student.startDate).getTime();
    
    let dateMatch = true;
    if (dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate).getTime();
      const endDate = new Date(dateRange.endDate).getTime();
      dateMatch = studentDate >= startDate && studentDate <= endDate;
    } else if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate).getTime();
      dateMatch = studentDate >= startDate;
    } else if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate).getTime();
      dateMatch = studentDate <= endDate;
    }
    
    return dateMatch;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center">
        <div className="text-xl text-red-500">Please sign in to access this page</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center">
        <div className="text-xl text-red-500">You do not have permission to access this page</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold text-[#fc5d01]">Student Analytics Dashboard</h1>
            
            <div className="mt-4 md:mt-0 flex items-center">
              <span className="text-sm text-gray-600 mr-2">Total Students: </span>
              <span className="font-semibold text-[#fc5d01]">{students.length}</span>
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="mb-8 p-6 bg-gradient-to-r from-[#fedac2] to-[#fff5ef] rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-xl font-semibold text-[#fc5d01]">Filter by Date Range</h2>
              <div className="mt-2 md:mt-0">
                <button
                  onClick={() => setDateRange({ startDate: '', endDate: '' })}
                  className="px-4 py-2 bg-white text-[#fc5d01] border border-[#fc5d01] rounded-md hover:bg-[#fc5d01] hover:text-white transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01] bg-white"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01] bg-white"
                />
              </div>
            </div>
            
            {dateRange.startDate || dateRange.endDate ? (
              <div className="mt-4 p-3 bg-white rounded-md border-l-4 border-[#fc5d01]">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Active Filter:</span> Showing students 
                  {dateRange.startDate ? ` from ${new Date(dateRange.startDate).toLocaleDateString('en-GB')}` : ''}
                  {dateRange.endDate ? ` to ${new Date(dateRange.endDate).toLocaleDateString('en-GB')}` : ''}
                  {' '}({filteredStudents.length} students)
                </p>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="bg-white rounded-lg shadow p-8">
              <p className="text-red-500 text-center">{error}</p>
            </div>
          ) : students.length > 0 ? (
            <AnalyticsCharts students={filteredStudents} />
          ) : (
            <div className="bg-white rounded-lg shadow p-8">
              <p className="text-gray-500 text-center">No student data available for analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
