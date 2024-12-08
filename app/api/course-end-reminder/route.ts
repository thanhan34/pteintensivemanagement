import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { Student } from '@/app/types/student';
import { sendCourseEndReminder } from '@/app/utils/emailService';

export async function GET() {
  try {
    const studentsRef = collection(db, 'students');
    const now = new Date();
    
    // Get all students
    const querySnapshot = await getDocs(studentsRef);
    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];

    // Filter students whose courses are ending in 2 months from their start date
    const studentsEndingSoon = students.filter(student => {
      const startDate = new Date(student.startDate);
      const courseEndDate = new Date(startDate.setMonth(startDate.getMonth() + student.studyDuration));
      const twoMonthsFromNow = new Date(now.setMonth(now.getMonth() + 2));
      
      // Check if course end date is within the next 2 months
      return courseEndDate <= twoMonthsFromNow && courseEndDate > now;
    });

    if (studentsEndingSoon.length > 0) {
      const reminderData = studentsEndingSoon.map(student => ({
        studentName: student.name,
        startDate: student.startDate,
        studyDuration: student.studyDuration,
        notes: student.notes
      }));

      await sendCourseEndReminder(reminderData);
      
      return NextResponse.json({
        message: 'Course end reminders sent successfully',
        studentsCount: studentsEndingSoon.length
      });
    }

    return NextResponse.json({
      message: 'No students with courses ending soon',
      studentsCount: 0
    });

  } catch (error) {
    console.error('Error in course end reminder cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process course end reminders' },
      { status: 500 }
    );
  }
}
