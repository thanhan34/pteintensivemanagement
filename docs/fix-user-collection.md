# Immediate Steps to Fix User Collection Issue

Follow these steps in order to resolve the issue with missing users collection:

## 1. Apply Test Rules First
1. Go to Firebase Console > Firestore Database > Rules
2. Copy and paste these temporary rules:
```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

## 2. Clear Browser Data
1. Sign out of the application
2. Open browser dev tools (F12)
3. Go to Application > Clear Storage
4. Click "Clear site data"
5. Close and reopen the browser

## 3. Verify Firebase Configuration
1. Go to Firebase Console > Project Settings
2. Check that your environment variables match exactly:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 4. Test Sign-In Process
1. Open browser dev tools (F12)
2. Go to Console tab
3. Start the development server:
```bash
npm run dev
```
4. Try signing in
5. Watch the console for any error messages

## 5. Check Firestore
1. Go to Firebase Console > Firestore Database
2. If 'users' collection doesn't exist:
   - It will be created automatically on first sign-in
   - You should see it appear after successful sign-in

## 6. If Still Not Working
1. Check browser console for errors
2. Verify in Firebase Console:
   - Authentication > Users (should see your email)
   - Firestore > Data (should see 'users' collection)
3. Check Network tab in browser dev tools:
   - Look for requests to Firestore
   - Check for any failed requests

## 7. Once Working
1. Replace the test rules with the secure rules from `firestore-rules.md`
2. Test again to ensure everything still works
3. Monitor for any new permission errors

## Common Error Solutions

### No Collection Created
If the collection still isn't created:
1. Check browser console for errors
2. Verify Firebase initialization in console:
```javascript
// Should see these logs:
"Firebase initialized with:"
"Starting user document creation/update process"
```

### Permission Errors
If you see permission errors:
1. Double-check the rules are published
2. Verify you're signed in (check Authentication tab)
3. Try signing out and back in

### Authentication Issues
If sign-in isn't working:
1. Verify Google provider is enabled in Firebase Console
2. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
3. Verify authorized domains include localhost

Contact for support if these steps don't resolve the issue.
