# Initial Firestore Rules for Testing

Use these simplified rules initially to verify user creation is working. Once confirmed, replace with the more secure rules from `firestore-rules.md`.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users for testing
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    match /attendance/{recordId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Setup Steps

1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Replace existing rules with the above
4. Click "Publish"

## Testing Process

1. Apply these simplified rules
2. Sign in to the application
3. Check browser console for any errors
4. Verify in Firebase Console that user document is created
5. Once confirmed working, replace with secure rules

## Verification Steps

1. After applying rules:
   ```bash
   # Start the development server
   npm run dev
   ```

2. Open browser console (F12)

3. Sign in and check for:
   - Successful authentication
   - User document creation
   - No permission errors

4. Check Firebase Console:
   - Go to Firestore Database
   - Look for 'users' collection
   - Verify document was created

## Common Issues

If still not working with these rules:

1. Check Firebase Configuration:
   ```javascript
   // In browser console
   console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
   ```

2. Verify Authentication:
   - Check Firebase Console > Authentication
   - Verify user is listed after sign-in

3. Check Network Requests:
   - Use browser dev tools Network tab
   - Look for Firestore API calls
   - Check for any failed requests

4. Verify Environment Variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   ```

## Next Steps

Once user creation is confirmed working:

1. Review the logs to ensure everything is functioning
2. Replace these rules with the secure version
3. Test again with secure rules
4. Monitor for any permission errors

Remember: These rules are for testing only and should not be used in production!
