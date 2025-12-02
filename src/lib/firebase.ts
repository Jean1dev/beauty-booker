import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
const storage = getStorage(app);

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  const isDevelopment = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  
  if (recaptchaSiteKey && recaptchaSiteKey.trim() !== "") {
    try {
      if (isDevelopment) {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      
      const provider = new ReCaptchaV3Provider(recaptchaSiteKey);
      initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
      
      if (isDevelopment) {
        console.log("App Check inicializado em modo de desenvolvimento. Verifique o console para o token de depuração.");
      }
    } catch (error: any) {
      console.warn("App Check não inicializado:", error?.message || error);
    }
  }

  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics não inicializado:", error);
  }
}

export { auth, googleProvider, analytics, db, storage };