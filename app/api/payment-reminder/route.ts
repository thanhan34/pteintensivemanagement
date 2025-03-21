import { NextResponse } from 'next/server';
import { db } from '@/app/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { sendPaymentReminder } from '@/app/utils/emailService';
import { Student } from '@/app/types/student';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/config/auth';

// Generate a secure token for cron job authentication
const CRON_SECRET = process.env.CRON_SECRET || 'pte-intensive-cron-2024-secure';

interface SendGridErrorResponse {
  code: number;
  message: string;
  response?: {
    headers: Record<string, string>;
    body: unknown;
    statusCode: number;
  };
}

export async function GET(request: Request) {
  try {
    // Check if this is an authorized cron job request
    const authHeader = request.headers.get('Authorization');
    const isAuthorizedCron = authHeader === `Bearer ${CRON_SECRET}`;
    
    if (!isAuthorizedCron) {
      // If it's not a Vercel cron request, check user authentication
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized access', error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get all students from Firestore
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];

    // Calculate the date 2 weeks ago
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Filter students with overdue payments
    const overdueStudents = students.filter(student => {
      const startDate = new Date(student.startDate);
      return (
        student.tuitionPaymentStatus !== 'paid' &&
        startDate <= twoWeeksAgo
      );
    });

    console.log(`Found ${overdueStudents.length} students with overdue payments`);

    if (overdueStudents.length > 0) {
      try {
        // Format student data for email
        const reminderData = overdueStudents.map(student => ({
          studentName: student.name,
          startDate: student.startDate,
          tuitionFee: student.tuitionFee,
          notes: student.notes
        }));

        // Send email notification
        const emailResponse = await sendPaymentReminder(reminderData);
        console.log('Email sent successfully:', emailResponse);

        return NextResponse.json({
          success: true,
          message: `Payment reminder sent for ${overdueStudents.length} students`,
          students: overdueStudents.map(s => ({
            name: s.name,
            startDate: s.startDate,
            tuitionFee: s.tuitionFee,
            paymentStatus: s.tuitionPaymentStatus,
            notes: s.notes
          }))
        });
      } catch (error) {
        const emailError = error as SendGridErrorResponse;
        console.error('Failed to send email:', emailError);
        return NextResponse.json({
          success: false,
          message: 'Found overdue payments but failed to send email notification',
          error: emailError.message || 'Unknown email error',
          sendGridError: emailError.response?.body || null,
          students: overdueStudents.map(s => s.name)
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'No overdue payments found'
    });

  } catch (error) {
    const serverError = error as Error;
    console.error('Error in payment reminder check:', serverError);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process payment reminder check',
        error: serverError.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
