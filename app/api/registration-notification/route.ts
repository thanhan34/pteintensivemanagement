import { NextResponse } from 'next/server';
import { sendRegistrationNotification } from '@/app/utils/emailService';

interface RegistrationData {
  name: string;
  phone: string;
  dob: string;
  province: string;
  targetScore: number;
  tuitionFee: number;
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as RegistrationData;
    
    // Validate required fields
    if (!data.name || !data.phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email notification
    await sendRegistrationNotification({
      name: data.name,
      phone: data.phone,
      dob: data.dob,
      province: data.province,
      targetScore: data.targetScore,
      tuitionFee: data.tuitionFee
    });

    return NextResponse.json({
      success: true,
      message: 'Registration notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending registration notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send registration notification',
        error: (error as Error).message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
