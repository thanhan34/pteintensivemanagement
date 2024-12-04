# Verification Steps for User Authentication and Role Management

Follow these steps in order to verify that the authentication and role management system is working correctly.

## 1. Environment Variables Check
```bash
# Check that these environment variables are set in .env.local
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

## 2. Firebase Console Setup Verification

### Check Firestore Rules
1. Go to Firebase Console > Firestore Database > Rules
2. Verify rules match those in `docs/firestore-rules.md`
3. Click "Publish" if you made any changes

### Verify Authentication Settings
1. Go to Firebase Console > Authentication
2. Check that Google provider is enabled
3. Verify authorized domains include your development URL

## 3. Testing User Creation

### First-Time Sign In
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open browser console (F12)
3. Go to http://localhost:3000
4. Click "Sign In"
5. Sign in with Google
6. Check browser console for logs:
   - Should see "Starting sign in process for user:"
   - Should see "Successfully created/updated user document:"

### Verify User Document
1. Go to Firebase Console > Firestore Database
2. Look for "users" collection
3. Find document with your email
4. Verify document contains:
   - email
   - name
   - role: "trainer"
   - createdAt
   - lastLogin

## 4. Testing Admin Role

### Assign Admin Role
1. In Firebase Console > Firestore Database
2. Find your user document
3. Edit the document
4. Change "role" to "admin"
5. Save changes

### Verify Admin Access
1. Sign out of the application
2. Sign in again
3. Check browser console for:
   - "Session updated with role: admin"
4. Verify you can see admin features:
   - Access to all attendance records
   - Ability to approve/reject submissions

## 5. Troubleshooting Common Issues

### User Document Not Created
If no user document appears:
1. Check browser console for errors
2. Verify Firestore rules allow write access
3. Check Firebase Console > Authentication for successful sign-in

### Permission Denied Errors
If you see permission errors:
1. Check Firestore rules in Firebase Console
2. Verify rules match `docs/firestore-rules.md`
3. Check user document exists and has correct role

### Role Not Updated
If role changes don't take effect:
1. Sign out completely
2. Clear browser cache
3. Sign in again
4. Check browser console for session updates

## 6. Logs to Check

### Browser Console
Look for these messages:
- "Firebase initialized with:"
- "Starting sign in process for user:"
- "Successfully created/updated user document:"
- "Session updated with role:"

### Firebase Console
Check these sections:
1. Authentication > Users
2. Firestore > Data
3. Firestore > Rules

## 7. Final Verification

- [ ] Environment variables are set correctly
- [ ] Firebase Console shows correct configuration
- [ ] User document is created on first sign-in
- [ ] Role can be updated in Firestore
- [ ] Session reflects correct role after sign-in
- [ ] Admin features are accessible with admin role
- [ ] Trainer features are accessible with trainer role

If any step fails, refer to `docs/troubleshooting.md` for detailed solutions.
