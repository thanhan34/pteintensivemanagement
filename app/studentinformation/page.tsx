'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import { Student, StudentFormData } from '../types/student';

export default function StudentInformation() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'admin';
  const isAssistant = session?.user?.role === 'administrative_assistant';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === 'authenticated' && (isAdmin || isAssistant)) {
      fetchStudents();
    }
  }, [status, session, mounted]);

  const fetchStudents = async () => {
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
  };

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

  const validateStudentData = (data: any): data is StudentFormData => {
    const requiredFields = ['name', 'targetScore', 'startDate', 'studyDuration', 
      'tuitionPaymentDates', 'tuitionPaymentStatus', 'trainerName', 'tuitionFee'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof data.name !== 'string' || data.name.trim() === '') {
      throw new Error('Name must be a non-empty string');
    }
    if (typeof data.targetScore !== 'number' || data.targetScore < 10 || data.targetScore > 90) {
      throw new Error('Target score must be a number between 10 and 90');
    }
    if (!Array.isArray(data.tuitionPaymentDates) || data.tuitionPaymentDates.length === 0) {
      throw new Error('Tuition payment dates must be a non-empty array');
    }
    if (!['paid', 'pending', 'overdue'].includes(data.tuitionPaymentStatus)) {
      throw new Error('Invalid tuition payment status');
    }
    if (typeof data.trainerName !== 'string' || data.trainerName.trim() === '') {
      throw new Error('Trainer name must be a non-empty string');
    }
    if (typeof data.tuitionFee !== 'number' || data.tuitionFee < 0) {
      throw new Error('Tuition fee must be a non-negative number');
    }

    return true;
  };

  const handleAddMultipleStudents = async () => {
    try {
      setJsonError(null);
      const studentsData = JSON.parse(jsonInput);
      
      if (!Array.isArray(studentsData)) {
        throw new Error('Input must be an array of students');
      }

      const validatedStudents: StudentFormData[] = studentsData.map((student, index) => {
        try {
          if (!validateStudentData(student)) {
            throw new Error(`Invalid student data at index ${index}`);
          }
          return student as StudentFormData;
        } catch (err) {
          throw new Error(`Error in student ${index + 1}: ${(err as Error).message}`);
        }
      });

      const addedStudents = await Promise.all(
        validatedStudents.map(async (studentData) => {
          const docRef = await addDoc(collection(db, 'students'), {
            ...studentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          return {
            ...studentData,
            id: docRef.id,
          } as Student;
        })
      );

      setStudents(prevStudents => [...prevStudents, ...addedStudents]);
      setJsonInput('');
      alert(`Successfully added ${addedStudents.length} students`);
    } catch (err) {
      console.error('Error adding students:', err);
      setJsonError((err as Error).message);
    }
  };

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

            {/* <div className="mt-8 p-4 bg-white rounded-lg shadow">
              <h2 className="text-xl font-bold text-[#fc5d01] mb-4">Add Multiple Students (JSON Format)</h2>
              <div className="mb-4">
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError(null);
                  }}
                  placeholder={`[
  {
    "name": "Student Name",
    "targetScore": 30,
    "startDate": "2023-11-20",
    "studyDuration": 3,
    "tuitionPaymentDates": ["2023-11-20"],
    "tuitionPaymentStatus": "pending",
    "trainerName": "Phương Tuyết",
    "tuitionFee": 6500000,
    "notes": ""
  }
]`}
                  rows={10}
                  className="w-full p-2 border rounded-md border-[#fedac2] focus:border-[#fc5d01] focus:ring-[#fc5d01]"
                />
              </div>
              {jsonError && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {jsonError}
                </div>
              )}
              <button
                onClick={handleAddMultipleStudents}
                className="w-full px-4 py-2 bg-[#fc5d01] text-white rounded-md hover:bg-[#fd7f33]"
              >
                Add Multiple Students
              </button>
            </div> */}
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
