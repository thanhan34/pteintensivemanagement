# Complete Setup Guide for PTE Management System

## 1. Firebase Project Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name and follow setup wizard
4. Enable Google Analytics (recommended)

### Configure Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable Google provider:
   - Click "Google" in providers list
   - Click "Enable"
   - Add your project's OAuth 2.0 Client ID and Secret
   - Save

### Set Up Firestore Database
1. Go to "Firestore Database"
2. Click "Create Database"
3. Choose production mode
4. Select a location closest to your users
5. Click "Enable"

### Configure Security Rules
1. Go to "Firestore Database" > "Rules" tab
2. Copy and paste the rules from `firestore-rules.md`
3. Click "Publish "

## 2. Environment Setup

### Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Under "Your apps", click web icon (</>)
3. Register app with a nickname
4. Copy the firebaseConfig object
5. Create `.env.local` file in project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 3. Setting Up Admin Users

### First-Time Setup
1. Start the application (`npm run dev`)
2. Sign in with Google using the account you want to make admin
3. This creates a user document in Firestore

### Assign Admin Role
1. Go to Firebase Console
2. Navigate to "Firestore Database"
3. Find the "users" collection
4. Locate the document with your email
5. Click "Edit" (pencil icon)
6. Change the "role" field to "admin"
7. Click "Update"

### Verify Admin Access
1. Sign out of the application
2. Sign back in
3. You should now see the admin interface
4. Test admin capabilities:
   - View all attendance records
   - Approve/reject submissions
   - Access admin-only features

## 4. Security Best Practices

### Managing Admin Access
- Keep track of all admin users
- Regularly audit admin list
- Remove admin access when no longer needed
- Use separate accounts for admin and regular use

### Database Security
- Never share Firebase credentials
- Regularly review security rules
- Monitor database usage
- Set up Firebase alerts for unusual activity

### User Management
- Regularly review user list
- Monitor failed login attempts
- Set up email notifications for new user signups
- Implement user activity logging

## 5. Troubleshooting

### Common Issues

#### User Not Created in Firestore
If user document isn't created:
1. Check Firebase console logs
2. Verify security rules
3. Check application logs for errors
4. Verify environment variables

#### Admin Access Not Working
If admin access isn't working:
1. Verify user document in Firestore
2. Check role spelling (must be exactly "admin")
3. Sign out and sign in again
4. Clear browser cache if needed

#### Authentication Issues
If users can't sign in:
1. Verify Google OAuth configuration
2. Check allowed domains in Firebase Console
3. Verify environment variables
4. Check browser console for errors

## 6. Maintenance

### Regular Tasks
1. Review security rules monthly
2. Audit admin users quarterly
3. Monitor database usage
4. Update dependencies regularly
5. Backup important data

### Monitoring
1. Set up Firebase Monitoring
2. Enable error reporting
3. Configure usage alerts
4. Review logs regularly

For additional support or questions, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- Project README.md
