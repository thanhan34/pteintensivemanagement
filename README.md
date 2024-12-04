# PTE Intensive Management System

A Next.js application for managing trainer attendance with role-based access control using Firebase and NextAuth.

## Features

- Google Authentication
- Role-based access control (Admin/Trainer)
- Attendance submission and tracking
- Attendance approval workflow
- Total hours tracking
- Secure data management with Firebase

## Prerequisites

- Node.js 16.x or later
- Firebase project
- Google OAuth credentials

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables as described above
4. Run the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Add your Firebase configuration to `.env.local`
5. Follow the admin setup guide in `docs/admin-setup.md`

## User Roles

### Trainer
- Can submit attendance records
- Can view their own attendance history
- Can track their total hours

### Admin
- Can view all attendance records
- Can approve/reject attendance submissions
- Can view total hours for all trainers

## Project Structure

```
pte-management/
├── app/
│   ├── api/
│   │   └── auth/
│   ├── attendance/
│   ├── auth/
│   └── home/
├── src/
│   ├── components/
│   ├── config/
│   └── types/
└── docs/
```

## Development

- Run development server:
  ```bash
  npm run dev
  ```

- Build for production:
  ```bash
  npm run build
  ```

- Start production server:
  ```bash
  npm start
  ```

## Security

- All routes are protected with NextAuth middleware
- Role-based access control is enforced at both client and server level
- Firebase security rules should be configured to match application permissions

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT
