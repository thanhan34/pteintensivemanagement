'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import { Student, StudentFormData } from '../types/student';

export default function Students() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const isAdmin = session?.user?.role === 'admin';
  const isAssistant = session?.user?.role === 'administrative_assistant';

  // Fetch students only for admin users
  const fetchStudents = useCallback(async () => {
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
  }, [isAdmin]);

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [status, isAdmin, fetchStudents]);

  const handleAddStudent = async (formData: StudentFormData) => {
    try {
      const docRef = await addDoc(collection(db, 'students'), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (isAdmin) {
        const newStudent: Student = {
          ...formData,
          id: docRef.id,
        };
        setStudents(prevStudents => [newStudent, ...prevStudents]);
        alert('Student added successfully');
      } else if (isAssistant) {
        setShowSuccessMessage(true);
        // Clear form
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student');
    }
  };

  const handleUpdateStudent = async (formData: StudentFormData) => {
    if (!editingStudent || !isAdmin) return;

    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });

      const updatedStudents = students.map((student) =>
        student.id === editingStudent.id
          ? { ...formData, id: student.id }
          : student
      );
      setStudents(updatedStudents);
      setEditingStudent(null);
      alert('Student updated successfully');
    } catch (err) {
      console.error('Error updating student:', err);
      alert('Failed to update student');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!isAdmin) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this student?');
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'students', id));
        setStudents(students.filter((student) => student.id !== id));
        alert('Student deleted successfully');
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Failed to delete student');
      }
    }
  };

  const handleEditStudent = (student: Student) => {
    if (!isAdmin) return;
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    if (!isAdmin) return;
    setEditingStudent(null);
  };

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

  if (!isAdmin && !isAssistant) {
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
          {/* Form Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#fc5d01] mb-4">
              {isAdmin && editingStudent ? 'Edit Student' : 'Add New Student'}
            </h1>
            {isAdmin && editingStudent && (
              <button
                onClick={handleCancelEdit}
                className="mb-4 px-4 py-2 bg-[#ffac7b] text-white rounded hover:bg-[#fd7f33]"
              >
                Cancel Edit
              </button>
            )}
            <StudentForm
              onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
              initialData={editingStudent || undefined}
            />
          </div>

          {/* Success Message for Assistant */}
          {isAssistant && showSuccessMessage && (
            <div className="mt-8 bg-white rounded-lg shadow p-8">
              <p className="text-center text-gray-600">
                Student added successfully! Only administrators can view and manage the student list.
              </p>
            </div>
          )}

          {/* Student List Section - Only for Admin */}
          {isAdmin && !showSuccessMessage && (
            <div>
              <h2 className="text-2xl font-bold text-[#fc5d01] mb-4">Student List</h2>
              {error ? (
                <div className="bg-white rounded-lg shadow p-8">
                  <p className="text-red-500 text-center">{error}</p>
                  <button
                    onClick={fetchStudents}
                    className="mt-4 px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#fd7f33]"
                  >
                    Retry
                  </button>
                </div>
              ) : students.length > 0 ? (
                <StudentList
                  students={students}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                />
              ) : (
                <div className="bg-white rounded-lg shadow p-8">
                  <p className="text-gray-500 text-center">No students added yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
