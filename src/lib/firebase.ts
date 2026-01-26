
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBuHTotpg_sHGXHPhPjidQpWIAEJdFsRkM",
    authDomain: "saveme-f5af0.firebaseapp.com",
    projectId: "saveme-f5af0",
    storageBucket: "saveme-f5af0.firebasestorage.app",
    messagingSenderId: "74008551035",
    appId: "1:74008551035:web:ddce606fe4008bc2d10cde",
    measurementId: "G-7Y7C7LFK1X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
