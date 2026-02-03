'use client';

import { useState, useMemo } from 'react';
import { Student } from '../types/student';
import { useSession } from 'next-auth/react';
import * as XLSX from 'xlsx';

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
  const [startDateFilter, setStartDateFilter] = useState(defaultDateRange?.defaultFromDate || '');
  const [endDateFilter, setEndDateFilter] = useState(defaultDateRange?.defaultToDate || '');
  const [expandedStudents, setExpandedStudents] = useState<{[key: string]: boolean}>({});
  const isAdmin = session?.user?.role === 'admin';
  const isFullAdmin = session?.user?.role === 'admin';
  const isAdministrativeAssistant = session?.user?.role === 'administrative_assistant';
  const isSaler = session?.user?.role === 'saler';
  const canViewFees = isFullAdmin; // Only full admins can see fees
  const canViewPhone = isFullAdmin || isSaler; // Admin and Saler can see phone numbers
  const canEdit = isFullAdmin || isAdministrativeAssistant || isSaler; // Admin, Assistant, and Saler can edit
  const canDelete = isFullAdmin; // Only full admins can delete
  const columnCount = canViewFees ? 8 : 7;
  
  const toggleExpanded = (studentId: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Memoized filtered and sorted students
  const filteredAndSortedStudents = useMemo(() => {
    if (!isAdmin && !isAdministrativeAssistant && !isSaler) return [];
    
    return [...students]
      .filter(student => {
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
        
        return textMatch && dateMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [students, searchTerm, sortOrder, isAdmin, isAdministrativeAssistant, isSaler, startDateFilter, endDateFilter]);

  // Access control check - allow admin, administrative_assistant, and saler
  if (!session?.user?.role || (session.user.role !== 'admin' && session.user.role !== 'administrative_assistant' && session.user.role !== 'saler')) {
    console.log('Unauthorized access attempted');
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-[#fedac2] text-[#fc5d01] border-[#fdbc94]';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Excel export function
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredAndSortedStudents.map(student => {
      // Format payment dates as a comma-separated string
      const paymentDates = student.tuitionPaymentDates.map(date => formatDate(date)).join(', ');
      
      const baseData: Record<string, string | number> = {
        'Student ID': student.studentId || '-',
        'Name': student.name,
        'Phone': canViewPhone ? student.phone : '***-***-****',
        'Province': student.province,
        'Country': student.country || 'Vietnam',
        'Date of Birth': student.dob ? formatDate(student.dob) : '-',
        'Start Date': formatDate(student.startDate),
        'Duration (months)': student.studyDuration,
        'Target Score': student.targetScore,
        'Trainer': student.trainerName,
        'Residential Address': student.residentialAddress || '-',
        'Payment Status': student.tuitionPaymentStatus,
        'Payment Dates': paymentDates,
        'Referrer': student.referrer || '-',
        'Notes': student.notes || '-',
        'Type': student.type || 'class',
        'Process Status': student.isProcess ? 'Processed' : 'Not Processed'
      };

      // Only include tuition fee if user has permission
      if (canViewFees) {
        baseData['Tuition Fee'] = student.tuitionFee;
      }

      return baseData;
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'all-students');
    
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `pte-students-all-${dateStr}.xlsx`;
    
    // Export to file
    XLSX.writeFile(workbook, fileName);
  };

  const getTypeColor = (type: Student['type']) => {
    switch (type) {
      case 'class':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '2345':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'one-on-one':
        return 'bg-[#fedac2] text-[#fc5d01] border-[#fdbc94]';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: Student['type']) => {
    switch (type) {
      case 'class':
        return 'Class';
      case '2345':
        return '2345';
      case 'one-on-one':
        return '1-1';
      default:
        return 'Class';
    }
  };

  return (
    <div className="mt-8">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-r from-[#fc5d01] to-[#fd7f33] rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Student Management</h2>
            <p className="text-[#fedac2]">Total: {filteredAndSortedStudents.length} students</p>
          </div>
        </div>
      </div>


      {/* Enhanced Search and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or trainer..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="text-sm font-medium text-gray-700">Filter by date range:</div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 min-w-[40px]">From:</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 min-w-[25px]">To:</label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fc5d01] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 bg-[#fc5d01] text-white rounded-lg hover:bg-[#fd7f33] transition-colors duration-200 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Table */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#fedac2]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Status</th>
                  {canViewFees && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Fee</th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#fc5d01] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedStudents.map((student) => (
                  <tbody key={student.id} className="divide-y divide-gray-200">
                    <tr className="hover:bg-[#fff5ef] transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.studentId || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.trainerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getTypeColor(student.type)}`}>
                          {getTypeLabel(student.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {canViewPhone ? student.phone : '***-***-****'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(student.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(student.tuitionPaymentStatus)}`}>
                          {student.tuitionPaymentStatus.charAt(0).toUpperCase() + student.tuitionPaymentStatus.slice(1)}
                        </span>
                      </td>
                      {canViewFees && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#fc5d01]">
                          {formatCurrency(student.tuitionFee)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleExpanded(student.id)}
                            className="text-[#fc5d01] hover:text-[#fd7f33] p-1 rounded"
                            title="View Details"
                          >
                            <svg className={`w-4 h-4 transform transition-transform ${expandedStudents[student.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => onEdit(student)}
                              className="text-[#fc5d01] hover:text-[#fd7f33] p-1 rounded"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => onDelete(student.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedStudents[student.id] && (
                      <tr className="bg-[#fff5ef]">
                        <td colSpan={columnCount} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h5 className="font-medium text-[#fc5d01] mb-2">Personal Information</h5>
                              <div className="space-y-2 text-sm">
                                <div><span className="text-gray-500">DOB:</span> {student.dob ? formatDate(student.dob) : '-'}</div>
                                <div><span className="text-gray-500">Referrer:</span> {student.referrer || '-'}</div>
                                <div><span className="text-gray-500">Residential Address:</span> {student.residentialAddress || '-'}</div>
                                <div><span className="text-gray-500">Province:</span> {student.province}</div>
                                <div><span className="text-gray-500">Country:</span> {student.country || 'Vietnam'}</div>
                                <div><span className="text-gray-500">Target Score:</span> {student.targetScore}</div>
                                <div><span className="text-gray-500">Duration:</span> {student.studyDuration} months</div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-[#fc5d01] mb-2">Payment History</h5>
                              <div className="flex flex-wrap gap-1">
                                {student.tuitionPaymentDates.map((date) => (
                                  <span key={date} className="bg-[#fedac2] text-[#fc5d01] text-xs px-2 py-1 rounded">
                                    {formatDate(date)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              {student.notes && (
                                <>
                                  <h5 className="font-medium text-[#fc5d01] mb-2">Notes</h5>
                                  <p className="text-sm text-gray-700">{student.notes}</p>
                                </>
                              )}
                              {student.type === 'one-on-one' && (
                                <div className="mt-4">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    student.isProcess ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {student.isProcess ? 'Processed' : 'Not Processed'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
