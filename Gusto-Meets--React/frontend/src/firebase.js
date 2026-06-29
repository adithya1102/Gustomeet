import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCFYSSSQ_FJaHV8-E6-LMZf-nU2R6DOGhw",
  authDomain: "gusto-meet.firebaseapp.com",
  projectId: "gusto-meet",
  storageBucket: "gusto-meet.firebasestorage.app",
  messagingSenderId: "751107980777",
  appId: "1:751107980777:web:99b10589c25eabcb6adf78"
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();