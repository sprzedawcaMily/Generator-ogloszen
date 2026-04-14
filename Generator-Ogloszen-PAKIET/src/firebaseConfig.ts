import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';

export const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBolGQVxZAxvMrwiMu1jGOrvyxjXgoLA0E',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'glowna-baza-danych-kamochi.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'glowna-baza-danych-kamochi',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'glowna-baza-danych-kamochi.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '903761746133',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:903761746133:web:66bc802ee3fa7c01602a5c',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-E4733GN755',
};

export const firebaseApp: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
