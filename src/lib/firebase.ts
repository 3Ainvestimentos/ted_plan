// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TEMPORÁRIO: Valores hardcoded como fallback
// Necessário devido a bug do Turbopack com variáveis NEXT_PUBLIC_*
// TODO: Remover quando Turbopack corrigir ou usar build sem Turbopack
const FALLBACK_CONFIG = {
  projectId: "ted-plan",
  appId: "1:814262984662:web:db26093158f4cc23ec4e77",
  storageBucket: "ted-plan.firebasestorage.app",
  apiKey: "AIzaSyDxFTnKm1-kS0g9vyfJ3TFt-EIsUT-JO_8",
  authDomain: "ted-plan.firebaseapp.com",
  messagingSenderId: "814262984662",
  measurementId: "G-DR2ZMK1D81"
};

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || FALLBACK_CONFIG.projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || FALLBACK_CONFIG.appId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || FALLBACK_CONFIG.storageBucket,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || FALLBACK_CONFIG.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || FALLBACK_CONFIG.authDomain,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_CONFIG.messagingSenderId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || FALLBACK_CONFIG.measurementId
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };