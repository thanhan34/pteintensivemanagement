# Quick Troubleshooting Guide

## "No Permission" / "No Users Collection" Issue

If you're experiencing issues with permissions or missing users collection after Google sign-in, follow these steps in order:

### 1. Verify Environment Variables
Check your `.env.local` file has all required variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 2. Set Up Firestore Security Rules
1. Go to Firebase Console > Firestore Database > Rules
2. Copy and paste the rules from `docs/firestore-rules.md`
3. Click "Publish"

### 3. Enable Firestore
1. Go to Firebase Console
2. Click "Firestore Database"
3. If not already done, click "Create Database"
4. Choose production mode
5. Select a location

### 4. Verify Google Authentication
1. Go to Firebase Console > Authentication
2. Ensure Google provider is enabled
3. Verify OAuth configuration matches your environment variables

### 5. Clear Browser Data and Restart
1. Sign out of the application
2. Clear browser cache and cookies
3. Restart the development server:
```bash
npm run dev
```

### 6. Test Sign-In Process
1. Sign in with Google
2. Check Firebase Console > Firestore Database
3. You should see a new "users" collection
4. User document should be created with default "trainer" role

### 7. Assign Admin Role
1. Go to Firebase Console > Firestore Database
2. Find your user document in the "users" collection
3. Edit the document
4. Change "role" field to "admin"
5. Save changes

### 8. Verify Access
1. Sign out
2. Sign in again
3. You should now have proper permissions

## Common Error Messages and Solutions

### "Error during sign in"
- Check browser console for detailed error message
- Verify Firebase configuration in environment variables
- Ensure Firestore is enabled and rules are published

### "No user document found"
- Check Firestore security rules
- Verify user collection permissions
- Check application logs for creation errors

### "Access denied"
- Verify user role in Firestore
- Check security rules implementation
- Sign out and sign in again to refresh session

## Still Having Issues?

1. Check application logs in browser console
2. Review Firebase Console logs
3. Verify all setup steps in `admin-setup.md`
4. Ensure all environment variables match Firebase configuration

For detailed setup instructions, refer to `docs/admin-setup.md`.
