import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { Student } from '@/app/types/student';
import { sendCourseEndReminder } from '@/app/utils/emailService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/config/auth';

// Generate a secure token for cron job authentication
const CRON_SECRET = process.env.CRON_SECRET || 'pte-intensive-cron-2024-secure';

export async function GET(request: Request) {
  try {
    // Check if this is an authorized cron job request
    const authHeader = request.headers.get('Authorization');
    const isAuthorizedCron = authHeader === `Bearer ${CRON_SECRET}`;
    
    if (!isAuthorizedCron) {
      // If it's not an authorized cron request, check user authentication
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized access', error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

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
