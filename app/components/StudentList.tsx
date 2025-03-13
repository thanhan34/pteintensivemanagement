'use client';

import { useState, useMemo } from 'react';
import { Student } from '../types/student';
import { useSession } from 'next-auth/react';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  defaultDateRange?: {
    defaultFromDate: string;
    defaultToDate: string;
  };
}

export default function StudentList({ students, onEdit, onDelete, defaultDateRange }: StudentListProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'one-on-one' | 'class' | '2345'>('class');
  const [startDateFilter, setStartDateFilter] = useState(defaultDateRange?.defaultFromDate || '');
  const [endDateFilter, setEndDateFilter] = useState(defaultDateRange?.defaultToDate || '');
  const [expandedStudents, setExpandedStudents] = useState<{[key: string]: boolean}>({});
  const isAdmin = session?.user?.role === 'admin';
  
  const toggleExpanded = (studentId: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Memoized filtered and sorted students
  const filteredAndSortedStudents = useMemo(() => {
    if (!isAdmin) return [];
    
    return [...students]
      .filter(student => {
        // Handle students without type field (legacy data) as 'class'
        const typeMatch = (student.type || 'class') === activeTab;
        
        // Text search filter
        const textMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.trainerName.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Date range filter
        let dateMatch = true;
        if (startDateFilter && endDateFilter) {
          const studentDate = new Date(student.startDate).getTime();
          const startDate = new Date(startDateFilter).getTime();
          const endDate = new Date(endDateFilter).getTime();
          dateMatch = studentDate >= startDate && studentDate <= endDate;
        } else if (startDateFilter) {
          const studentDate = new Date(student.startDate).getTime();
          const startDate = new Date(startDateFilter).getTime();
          dateMatch = studentDate >= startDate;
        } else if (endDateFilter) {
          const studentDate = new Date(student.startDate).getTime();
          const endDate = new Date(endDateFilter).getTime();
          dateMatch = studentDate <= endDate;
        }
        
        return typeMatch && textMatch && dateMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [students, searchTerm, sortOrder, isAdmin, activeTab, startDateFilter, endDateFilter]);

  // Strict admin-only check after hooks
  if (!session?.user?.role || session.user.role !== 'admin') {
    console.log('Non-admin access attempted');
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Student['tuitionPaymentStatus']) => {
    switch (status) {
      case 'paid':
        return 'bg-[#fedac2] text-[#fc5d01]';
      case 'pending':
        return 'bg-[#ffac7b] text-[#fc5d01]';
      case 'overdue':
        return 'bg-[#fc5d01] text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="mt-8">
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('class')}
            className={`${
              activeTab === 'class'
                ? 'border-[#fc5d01] text-[#fc5d01]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Class Students
          </button>
          <button
            onClick={() => setActiveTab('2345')}
            className={`${
              activeTab === '2345'
                ? 'border-[#fc5d01] text-[#fc5d01]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            2345 Students
          </button>
          <button
            onClick={() => setActiveTab('one-on-one')}
            className={`${
              activeTab === 'one-on-one'
                ? 'border-[#fc5d01] text-[#fc5d01]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            1-1 Students
          </button>
        </nav>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or trainer..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by date:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4 bg-[#fedac2] p-4 rounded-lg">
        <div className="text-[#fc5d01] font-medium">Filter by date range:</div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To:</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc5d01]"
          />
        </div>
        <button
          onClick={() => {
            setStartDateFilter('');
            setEndDateFilter('');
          }}
          className="px-4 py-2 bg-[#fc5d01] text-white rounded-md hover:bg-[#fd7f33]"
        >
          Clear Filters
        </button>
      </div>

      {/* List-based Student List with Expandable Sections */}
      <div className="space-y-4">
        {filteredAndSortedStudents.map((student) => {
          const isExpanded = expandedStudents[student.id] || false;
          return (
            <div key={student.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Main Row - Always Visible */}
              <div className="grid grid-cols-12 items-center px-4 py-3 gap-2 bg-[#fff5ef]">
                <div className="col-span-3 font-medium text-[#fc5d01]">{student.name}</div>
                <div className="col-span-2">{student.phone || '-'}</div>
                <div className="col-span-2">{student.province || '-'}</div>
                <div className="col-span-2">{formatDate(student.startDate)}</div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.tuitionPaymentStatus)}`}>
                    {student.tuitionPaymentStatus.charAt(0).toUpperCase() + student.tuitionPaymentStatus.slice(1)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button 
                    onClick={() => toggleExpanded(student.id)}
                    className="p-1 rounded-full hover:bg-[#fedac2]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[#fc5d01] transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Personal Information */}
                    <div>
                      <h4 className="font-medium text-[#fc5d01] mb-2">Personal Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500 block">Date of Birth</span>
                          <span>{student.dob ? formatDate(student.dob) : '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Country</span>
                          <span>{student.country || 'Vietnam'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Referrer</span>
                          <span>{student.referrer || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Trainer</span>
                          <span>{student.trainerName}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Study Details */}
                    <div>
                      <h4 className="font-medium text-[#fc5d01] mb-2">Study Details</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500 block">Target Score</span>
                          <span>{student.targetScore}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Duration</span>
                          <span>{student.studyDuration} months</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Tuition Fee</span>
                          <span className="font-medium text-[#fc5d01]">{formatCurrency(student.tuitionFee)}</span>
                        </div>
                        {activeTab === 'one-on-one' && (
                          <div>
                            <span className="text-xs text-gray-500 block">Process Status</span>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${student.isProcess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {student.isProcess ? 'Processed' : 'Not Processed'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Payment & Notes */}
                    <div>
                      <h4 className="font-medium text-[#fc5d01] mb-2">Payment & Notes</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Payment Dates</span>
                          <div className="flex flex-wrap gap-1">
                            {student.tuitionPaymentDates.map((date) => (
                              <span key={date} className="bg-[#fedac2] text-[#fc5d01] text-xs px-2 py-1 rounded">
                                {formatDate(date)}
                              </span>
                            ))}
                          </div>
                        </div>
                        {student.notes && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Notes</span>
                            <p className="text-sm text-gray-700">{student.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(student)}
                      className="px-4 py-2 bg-[#fedac2] text-[#fc5d01] rounded-md hover:bg-[#fc5d01] hover:text-white transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(student.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
