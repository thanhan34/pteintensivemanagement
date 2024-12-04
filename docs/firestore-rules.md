# Firestore Security Rules

Copy and paste these updated rules into your Firebase Console under Firestore Database > Rules:

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Allow initial user document creation during sign-in
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
        isAdmin() ||
        // Allow initial document creation during sign-in
        (request.method == 'create' && request.auth.uid == userId));
    }

    // Attendance records
    match /attendance/{recordId} {
      allow read: if request.auth != null && 
        (isAdmin() || resource.data.trainerId == request.auth.uid);
      
      allow create: if request.auth != null && 
        request.resource.data.trainerId == request.auth.uid;
      
      allow update: if request.auth != null && 
        (isAdmin() || 
        (resource.data.trainerId == request.auth.uid && resource.data.status == 'pending'));
    }

    // Student records - admin only access
    match /students/{studentId} {
      allow read, write: if request.auth != null && isAdmin();
    }
  }
}
```

## Important Changes in These Rules

1. Added Helper Function:
   - `isAdmin()` function to check admin role
   - Reduces code duplication
   - Makes rules more maintainable

2. User Document Access:
   - Users can read/write their own documents
   - Admins can access all user documents
   - Special provision for initial document creation

3. Attendance Records:
   - Trainers can read their own records and create new ones
   - Trainers can update pending records
   - Admins have full access

4. Student Records (New):
   - Only admins can read and write student records
   - Complete access control for student data
   - Prevents unauthorized access

## Setup Instructions

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Firestore Database" in the left sidebar
4. Click the "Rules" tab
5. Replace ALL existing rules with the ones above
6. Click "Publish"

## Testing the Rules

You can test these rules in the Firebase Console Rules Playground:

### Test Case 1: Admin Accessing Student Records
```javascript
{
  "request": {
    "auth": {
      "uid": "admin123"
    },
    "method": "get",
    "path": "/databases/(default)/documents/students/student123"
  }
}
```

### Test Case 2: Non-Admin Attempting Student Access
```javascript
{
  "request": {
    "auth": {
      "uid": "trainer123"
    },
    "method": "get",
    "path": "/databases/(default)/documents/students/student123"
  }
}
```

## Troubleshooting

If you encounter access issues:

1. Check User Role:
   - Verify user document exists in Firestore
   - Confirm role is set to 'admin' for admin users

2. Test Authentication:
   - Ensure user is properly signed in
   - Check auth token in Firebase Console

3. Verify Rules:
   - Rules are properly published
   - No syntax errors in rules
   - Correct collection paths

4. Monitor Logs:
   - Check Firebase Console logs
   - Look for permission denied errors
   - Review rule evaluation logs

Remember to monitor the Firebase Console logs for any security rule violations or access denied errors.
