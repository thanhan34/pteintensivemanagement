import cron from 'node-cron';

export const initializeCronJobs = () => {
  // Schedule payment reminder check to run at 9:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('Running payment reminder check...');
      
      // Use absolute URL for the API endpoint
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/payment-reminder`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-auth': process.env.CRON_SECRET || 'pte-intensive-cron-2024-secure'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.students?.length > 0) {
          console.log('Payment reminder sent for students:', result.students.join(', '));
        } else {
          console.log('No overdue payments found');
        }
      } else {
        console.error('Payment reminder check failed:', result.message);
        if (result.error) {
          console.error('Error details:', result.error);
        }
      }
    } catch (error) {
      console.error('Error in payment reminder cron job:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh" // Vietnam timezone
  });

  console.log('Payment reminder cron job initialized - scheduled for 9:00 AM daily (Vietnam time)');
};
