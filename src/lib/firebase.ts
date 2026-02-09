
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuHTotpg_sHGXHPhPjidQpWIAEJdFsRkM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "saveme-f5af0.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "saveme-f5af0",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "saveme-f5af0.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "74008551035",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:74008551035:web:ddce606fe4008bc2d10cde",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7Y7C7LFK1X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
