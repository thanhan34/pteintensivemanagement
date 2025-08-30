# Firebase Storage Setup and CORS Configuration

## CORS Issue Fix

The CORS error occurs because Firebase Storage needs proper CORS configuration. Here are the steps to fix it:

### Option 1: Configure CORS using Google Cloud SDK

1. Install Google Cloud SDK if not already installed
2. Run the following command to set CORS policy:

```bash
gsutil cors set cors.json gs://pteintensivemanagement.firebasestorage.app
```

### Option 2: Use Firebase Storage Rules

Update your Firebase Storage rules in the Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Option 3: Server-side Upload API (Recommended)

Create a server-side API route to handle uploads, which bypasses CORS issues entirely.

## Alternative Solution: Server-side Upload

If CORS configuration is not possible, use the server-side upload API route that has been implemented in `/api/upload-image`.

## Testing

After applying CORS configuration:
1. Restart your development server
2. Try uploading an image in the accounting form
3. Check browser console for any remaining errors

## Security Notes

- The current CORS configuration allows all origins (`*`) for development
- In production, restrict origins to your domain only
- Ensure Firebase Storage rules are properly configured to prevent unauthorized access
