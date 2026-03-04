import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // Initialize Firestore
  db = getFirestore(app);

  // Enable offline persistence if in browser environment
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err: { code: string }) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser doesn\'t support persistence.');
      }
    });
  }

  // Initialize Auth
  auth = getAuth(app);

  // Initialize Storage
  storage = getStorage(app);

} catch (error) {
  console.error('Error initializing Firebase:', error);
  if (error instanceof Error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
  }
  throw new Error('Failed to initialize Firebase. Check your configuration.');
}

// Verify initialization
if (!app || !db || !auth || !storage) {
  console.error('Firebase services not properly initialized');
  throw new Error('Firebase services not properly initialized');
}

export { app, db, auth, storage };
