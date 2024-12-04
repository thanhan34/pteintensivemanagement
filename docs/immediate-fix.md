# Immediate Steps to Fix Permission Issue

Follow these steps in exact order to resolve the current permission and user collection issues:

## 1. Clear All Data
1. Sign out of the application
2. Clear browser data:
   - Open Chrome DevTools (F12)
   - Go to Application > Storage
   - Click "Clear site data"
   - Close the browser completely

## 2. Update Firestore Rules
1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Replace ALL current rules with this temporary set:
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
4. Click "Publish"

## 3. Restart Development Server
1. Stop the current server (Ctrl+C)
2. Clear terminal
3. Start server fresh:
```bash
npm run dev
```

## 4. Test Sign-In Process
1. Open browser in incognito/private mode
2. Open DevTools (F12)
3. Go to Console tab
4. Clear console
5. Visit http://localhost:3000
6. Click "Sign In"
7. Complete Google sign-in

## 5. Check Console Logs
You should see these logs in order:
```
SignIn callback started
Starting user document creation/verification: [userId]
User document does not exist, creating new document
Successfully created new user document
SignIn process completed successfully
```

## 6. Verify in Firebase Console
1. Go to Firebase Console
2. Check Authentication > Users
   - Should see your email listed
3. Check Firestore Database > Data
   - Should see 'users' collection
   - Should see your user document inside it

## 7. If Still Getting Permission Error
1. Check that NEXTAUTH_SECRET is set in .env.local
2. Verify all Firebase environment variables are correct
3. Try signing out and in again
4. Check browser console for specific error messages

## 8. Once Working
1. Replace the Firestore rules with the secure version:
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        (request.method == 'create' && request.auth.uid == userId));
    }
  }
}
```

## Environment Variables Check
Ensure these are set in .env.local:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Still Having Issues?
If you're still experiencing problems after following these steps:
1. Check browser console for specific error messages
2. Look for errors in the terminal running the development server
3. Verify Firebase Console > Authentication shows your sign-in
4. Check Network tab in DevTools for failed requests

Contact support if issues persist after following these steps.
