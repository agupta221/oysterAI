import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
export function initializeFirebaseAdmin() {
  // Check if Firebase Admin is already initialized
  if (getApps().length === 0) {
    try {
      // Initialize with service account if available
      if (process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            // Replace escaped newlines in the private key
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('Firebase Admin initialized with service account credentials');
      } 
      // Fall back to application default credentials
      else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        initializeApp({
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('Firebase Admin initialized with application default credentials');
      } 
      else {
        console.warn('No Firebase Admin credentials found. Some server-side Firebase features may not work.');
        // Initialize with minimal config to avoid errors
        initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
    }
  }
} 