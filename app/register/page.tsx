'use client';

import { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import PublicStudentForm from '../components/PublicStudentForm';
import { StudentFormData } from '../types/student';

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: StudentFormData) => {
    try {
      // Add isPublicSubmission flag to identify submissions from public form
      await addDoc(collection(db, 'students'), {
        ...formData,
        isPublicSubmission: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Gửi email thông báo cho admin thông qua API route
      try {
        const response = await fetch('/api/registration-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            dob: formData.dob,
            province: formData.province,
            targetScore: formData.targetScore,
            tuitionFee: formData.tuitionFee
          }),
        });
        
        if (response.ok) {
          console.log('Đã gửi email thông báo đăng ký thành công');
        } else {
          console.error('Lỗi khi gửi email thông báo:', await response.text());
        }
      } catch (emailError) {
        // Ghi log lỗi nhưng không ảnh hưởng đến trải nghiệm người dùng
        console.error('Lỗi khi gửi email thông báo:', emailError);
      }
      
      setSubmitted(true);
      setError(null);
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Đăng ký không thành công. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#fc5d01] mb-2">PTE Intensive</h1>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Đăng Ký Học Viên</h2>
          <p className="text-gray-600 mb-8">Vui lòng điền thông tin bên dưới để đăng ký</p>
        </div>
        
        {submitted ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-4 text-[#fc5d01]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#fc5d01] mb-2">Đăng Ký Thành Công!</h2>
            <p className="text-gray-600 mb-6">Cảm ơn bạn đã đăng ký. Thông tin của bạn đã được gửi thành công.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}
            <PublicStudentForm onSubmit={handleSubmit} />
          </div>
        )}
      </div>
    </div>
  );
}
