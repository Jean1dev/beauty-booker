import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, analytics };