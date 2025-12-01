import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYPjuNaYDo_66VFe30FADifhMxzuonEeA",
  authDomain: "beaulty-book.firebaseapp.com",
  projectId: "beaulty-book",
  storageBucket: "beaulty-book.firebasestorage.app",
  messagingSenderId: "430911372516",
  appId: "1:430911372516:web:1dcda82966d2827b6b00f1",
  measurementId: "G-55V22JZYHE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics não inicializado:", error);
  }
}

export { auth, googleProvider, analytics, db };