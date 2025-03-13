# Setting Up Cron Jobs with cron-job.org

This guide explains how to set up cron jobs for PTE Intensive Management using [cron-job.org](https://console.cron-job.org) instead of Vercel's built-in cron functionality.

## Why Use cron-job.org?

- Free tier allows more cron jobs than Vercel's free plan
- More flexible scheduling options
- Detailed execution logs and monitoring
- Email notifications for failed jobs

## Required Cron Jobs

The application needs two cron jobs:

1. **Payment Reminder** - Sends reminders for overdue payments
2. **Course End Reminder** - Sends reminders for courses that are ending soon

## Setup Instructions

### Step 1: Create an Account on cron-job.org

1. Go to [console.cron-job.org](https://console.cron-job.org)
2. Sign up for a new account or log in if you already have one

### Step 2: Create the Payment Reminder Cron Job

1. Click on "Create cronjob" button
2. Fill in the following details:
   - **Title**: PTE Intensive - Payment Reminder
   - **URL**: `https://your-domain.com/api/payment-reminder` (replace with your actual domain)
   - **Authentication**: HTTP Headers
     - Add a header with name `Authorization` and value `Bearer YOUR_CRON_SECRET` (replace with the value of your CRON_SECRET environment variable)
   - **Schedule**: Set to run daily at 2:00 AM (or your preferred time)
   - **Notification**: Configure email notifications for failures if desired

3. Click "Create" to save the cron job

### Step 3: Create the Course End Reminder Cron Job

1. Click on "Create cronjob" button again
2. Fill in the following details:
   - **Title**: PTE Intensive - Course End Reminder
   - **URL**: `https://your-domain.com/api/course-end-reminder` (replace with your actual domain)
   - **Authentication**: HTTP Headers
     - Add a header with name `Authorization` and value `Bearer YOUR_CRON_SECRET` (replace with the value of your CRON_SECRET environment variable)
   - **Schedule**: Set to run daily at 2:00 AM (or your preferred time)
   - **Notification**: Configure email notifications for failures if desired

3. Click "Create" to save the cron job

### Step 4: Test the Cron Jobs

1. In the cron-job.org dashboard, select each job and click "Run now" to test
2. Check the execution logs to ensure the job ran successfully
3. Verify that the emails were sent as expected

## Security Considerations

- The `CRON_SECRET` environment variable should be a strong, random string
- This secret is used to authenticate the cron job requests
- Never share this secret or expose it in client-side code
- The API routes are already configured to check for this secret in the Authorization header

## Troubleshooting

If the cron jobs are not working as expected:

1. Check the execution logs in cron-job.org
2. Verify that the URLs are correct and accessible
3. Ensure the Authorization header is properly configured
4. Check your application logs for any errors
5. Verify that SendGrid is properly configured and working

## Additional Configuration

You can adjust the schedule for each cron job based on your needs:

- Payment reminders might be more effective if sent weekly instead of daily
- Course end reminders could be sent less frequently, such as once a week

Adjust the schedule in cron-job.org as needed without having to modify your application code.
