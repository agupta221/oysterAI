import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug Firebase config
console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : undefined,
});

// Validate required config
if (!firebaseConfig.projectId) {
  throw new Error('Firebase projectId is required');
}

// Initialize Firebase
let app;
try {
  if (getApps().length) {
    console.log('Firebase app already initialized');
    app = getApp();
  } else {
    console.log('Initializing Firebase app');
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  throw error;
}

// Initialize services
console.log('Initializing Firebase services');

// Initialize Auth with monitoring
const auth = getAuth(app);
onAuthStateChanged(auth, (user) => {
  console.log('Firebase Auth State Changed:', {
    isAuthenticated: !!user,
    userId: user?.uid,
    email: user?.email,
  });
});

// Initialize Firestore with settings
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

console.log('Firebase initialization complete');

// Debug function to check auth state
export const checkAuthState = () => {
  const user = auth.currentUser;
  console.log('Current Auth State:', {
    isAuthenticated: !!user,
    userId: user?.uid,
    email: user?.email,
  });
  if (!user) throw new Error('User must be logged in');
  return user;
};

export { app, auth, db, storage };
