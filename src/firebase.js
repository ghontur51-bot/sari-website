import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJVeaVGpYrDEcAHymuEbVjIOYP672kvt4",
  authDomain: "sari-16d88.firebaseapp.com",
  projectId: "sari-16d88",
  storageBucket: "sari-16d88.firebasestorage.app",
  messagingSenderId: "939690087400",
  appId: "1:939690087400:web:1e5eb0496b4109c3e20a5d",
  measurementId: "G-ZK272KG2H8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
