// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-946110166-f3289",
  "appId": "1:375118948145:web:5a366223607d83f604b210",
  "storageBucket": "studio-946110166-f3289.firebasestorage.app",
  "apiKey": "AIzaSyD1cNIIw4oxI2dLaPigZr2XnbBRhWD7TgM",
  "authDomain": "studio-946110166-f3289.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "375118948145"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
