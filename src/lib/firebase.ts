
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "ted-10",
  "appId": "1:948379117536:web:bbd341b61cd58d7d82ed85",
  "storageBucket": "ted-10.firebasestorage.app",
  "apiKey": "AIzaSyAFSjlKRc8CEdR0pIgDoo0VUp6u2mEqZdo",
  "authDomain": "ted-10.firebaseapp.com",
  "messagingSenderId": "948379117536"
};

// Dynamically set authDomain for local development to fix auth/unauthorized-domain error
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    firebaseConfig.authDomain = `${window.location.hostname}:9002`;
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
