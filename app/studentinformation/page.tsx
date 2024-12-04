'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import { Student, StudentFormData } from '../types/student';

// interface StudentValidationData {
//   name: string;
//   targetScore: number;
//   startDate: string;
//   studyDuration: number;
//   tuitionPaymentDates: string[];
//   tuitionPaymentStatus: 'paid' | 'pending' | 'overdue';
//   trainerName: string;
//   tuitionFee: number;
//   notes: string;
// }

export default function StudentInformation() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);  

  const isAdmin = session?.user?.role === 'admin';
  const isAssistant = session?.user?.role === 'administrative_assistant';

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const q = query(collection(db, 'students'), orderBy('name'));
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
  }, []);

  useEffect(() => {
    if (mounted && status === 'authenticated' && (isAdmin || isAssistant)) {
      fetchStudents();
    }
  }, [status, mounted, isAdmin, isAssistant, fetchStudents]);

  const handleAddStudent = async (formData: StudentFormData) => {
    try {
      const docRef = await addDoc(collection(db, 'students'), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newStudent: Student = {
        ...formData,
        id: docRef.id,
      };

      setStudents([...students, newStudent]);
      alert('Student added successfully');
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Failed to add student');
    }
  };

  const handleUpdateStudent = async (formData: StudentFormData) => {
    if (!editingStudent) return;

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
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  // const validateStudentData = (data: unknown): data is StudentValidationData => {
  //   if (!data || typeof data !== 'object') {
  //     throw new Error('Invalid data format');
  //   }

  //   const studentData = data as Partial<StudentValidationData>;
  //   const requiredFields = ['name', 'targetScore', 'startDate', 'studyDuration', 
  //     'tuitionPaymentDates', 'tuitionPaymentStatus', 'trainerName', 'tuitionFee', 'notes'];
    
  //   for (const field of requiredFields) {
  //     if (!(field in studentData)) {
  //       throw new Error(`Missing required field: ${field}`);
  //     }
  //   }

  //   if (typeof studentData.name !== 'string' || studentData.name.trim() === '') {
  //     throw new Error('Name must be a non-empty string');
  //   }
  //   if (typeof studentData.targetScore !== 'number' || studentData.targetScore < 10 || studentData.targetScore > 90) {
  //     throw new Error('Target score must be a number between 10 and 90');
  //   }
  //   if (!Array.isArray(studentData.tuitionPaymentDates) || studentData.tuitionPaymentDates.length === 0) {
  //     throw new Error('Tuition payment dates must be a non-empty array');
  //   }
  //   if (!['paid', 'pending', 'overdue'].includes(studentData.tuitionPaymentStatus as string)) {
  //     throw new Error('Invalid tuition payment status');
  //   }
  //   if (typeof studentData.trainerName !== 'string' || studentData.trainerName.trim() === '') {
  //     throw new Error('Trainer name must be a non-empty string');
  //   }
  //   if (typeof studentData.tuitionFee !== 'number' || studentData.tuitionFee < 0) {
  //     throw new Error('Tuition fee must be a non-negative number');
  //   }
  //   if (typeof studentData.notes !== 'string') {
  //     throw new Error('Notes must be a string');
  //   }

  //   return true;
  // };

  if (!mounted) {
    return null;
  }

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

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#fc5d01] mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h1>
            {editingStudent && (
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
        </div>
      </div>
    </div>
  );
}
