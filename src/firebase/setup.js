// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtvk1XhUjfQLUEDcDJ5OLYuTxpPhqfpSc",
  authDomain: "saheli-2228c.firebaseapp.com",
  projectId: "saheli-2228c",
  storageBucket: "saheli-2228c.appspot.com", // Corrected storageBucket
  messagingSenderId: "671118502624",
  appId: "1:671118502624:web:a8f2491e3ca507c22a7e85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);   // Pass app to getAuth()
export const db = getFirestore(app); // Pass app to getFirestore
export default app;