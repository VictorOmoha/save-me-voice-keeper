
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * True when every required Firebase env var is present. When false the app
 * boots against placeholder values instead of crashing at module init with a
 * blank white page (getAuth throws auth/invalid-api-key on a missing key);
 * main.tsx checks this flag and renders a configuration error screen.
 */
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const effectiveConfig = isFirebaseConfigured
    ? firebaseConfig
    : {
        apiKey: 'missing-firebase-config',
        authDomain: 'missing.firebaseapp.com',
        projectId: 'missing-firebase-config',
        storageBucket: 'missing.appspot.com',
        messagingSenderId: '0',
        appId: '1:0:web:0',
    };

if (!isFirebaseConfigured) {
    console.error(
        '[firebase] Missing Firebase configuration. Set VITE_FIREBASE_* variables ' +
        '(see .env.example). The app will render a configuration error screen.'
    );
}

const app = initializeApp(effectiveConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analyticsInstance: Analytics | null = null;
if (isFirebaseConfigured) {
    try {
        analyticsInstance = getAnalytics(app);
    } catch (error) {
        console.warn('[firebase] Analytics unavailable in this environment.', error);
    }
}
export const analytics = analyticsInstance;
