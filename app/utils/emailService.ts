import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not defined in environment variables');
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface PaymentReminderData {
  studentName: string;
  startDate: string;
  tuitionFee: number;
  notes: string;
}

export const sendPaymentReminder = async (overdueStudents: PaymentReminderData[]) => {
  if (!overdueStudents.length) return;

  if (!process.env.SENDER_EMAIL || !process.env.ADMIN_EMAIL) {
    throw new Error('SENDER_EMAIL or ADMIN_EMAIL is not defined in environment variables');
  }

  const studentList = overdueStudents
    .map(
      student => `
      - ${student.studentName}
        Start Date: ${new Date(student.startDate).toLocaleDateString()}
        Tuition Fee: $${student.tuitionFee}
        Notes: ${student.notes || 'No notes available'}
      `
    )
    .join('\n');

  const msg = {
    to: process.env.ADMIN_EMAIL,
    from: {
      email: process.env.SENDER_EMAIL,
      name: 'PTE Intensive Management'
    },
    subject: 'PTE Intensive - Overdue Tuition Payment Reminder',
    text: `
    The following students have overdue tuition payments (over 2 weeks since start date):
    
    ${studentList}
    
    Please follow up with these students regarding their payment status.
    `,
    html: `
    <h2>Overdue Tuition Payment Reminder</h2>
    <p>The following students have overdue tuition payments (over 2 weeks since start date):</p>
    <div style="margin: 20px 0; padding: 10px; background-color: #f5f5f5;">
      ${overdueStudents
        .map(
          student => `
          <div style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
            <strong>${student.studentName}</strong><br/>
            Start Date: ${new Date(student.startDate).toLocaleDateString()}<br/>
            Tuition Fee: $${student.tuitionFee}<br/>
            ${student.notes ? `<div style="margin-top: 5px; color: #666;">Notes: ${student.notes}</div>` : ''}
          </div>
        `
        )
        .join('')}
    </div>
    <p>Please follow up with these students regarding their payment status.</p>
    `,
  };

  try {
    console.log('Attempting to send email with SendGrid...');
    console.log('From:', process.env.SENDER_EMAIL);
    console.log('To:', process.env.ADMIN_EMAIL);
    
    const response = await sgMail.send(msg);
    console.log('SendGrid API Response:', response[0].statusCode);
    console.log('Payment reminder email sent successfully');
    
    return response;
  } catch (error: any) {
    console.error('Error sending payment reminder email:');
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    if (error?.response) {
      console.error('SendGrid API Error Response:');
      console.error('Status code:', error.response.statusCode);
      console.error('Body:', error.response.body);
      console.error('Headers:', error.response.headers);
    }
    throw error;
  }
};
