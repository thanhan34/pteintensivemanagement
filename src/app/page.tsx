'use client';

import { useState } from 'react';
import StudentForm from '../components/StudentForm';
import StudentList from '../components/StudentList';
import { Student, StudentFormData } from '../types/student';

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleAddStudent = (formData: StudentFormData) => {
    const newStudent: Student = {
      ...formData,
      id: Date.now().toString(),
    };
    setStudents([...students, newStudent]);
  };

  const handleUpdateStudent = (formData: StudentFormData) => {
    if (!editingStudent) return;

    const updatedStudents = students.map((student) =>
      student.id === editingStudent.id
        ? { ...formData, id: student.id }
        : student
    );
    setStudents(updatedStudents);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this student?');
    if (confirmDelete) {
      setStudents(students.filter((student) => student.id !== id));
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h1>
            {editingStudent && (
              <button
                onClick={handleCancelEdit}
                className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Student List</h2>
            {students.length > 0 ? (
              <StudentList
                students={students}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No students added yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
