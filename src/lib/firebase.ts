import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
let analytics: Analytics | undefined;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  // Only initialize analytics on the client side
  if (typeof window !== 'undefined') {
    // Initialize analytics only if supported
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    });
  }
} else {
  firebaseApp = getApps()[0];
}

// Initialize Firebase Authentication
const auth: Auth = getAuth(firebaseApp);

export { firebaseApp, auth, analytics }; 