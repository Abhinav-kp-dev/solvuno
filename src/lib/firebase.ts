import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJB6cvG7ImdWak1-l_qUYKXgrTQX3OPqU",
  authDomain: "solvuno-dev.firebaseapp.com",
  projectId: "solvuno-dev",
  storageBucket: "solvuno-dev.firebasestorage.app",
  messagingSenderId: "635110620766",
  appId: "1:635110620766:web:1e50f872f9ca02ee837ecf",
  measurementId: "G-RM4XJN24YR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
