import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(", ")}. ` +
    `Please create a .env file with the required variables. See .env.example for reference.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey!,
  authDomain: requiredEnvVars.authDomain!,
  projectId: requiredEnvVars.projectId!,
  storageBucket: requiredEnvVars.storageBucket!,
  messagingSenderId: requiredEnvVars.messagingSenderId!,
  appId: requiredEnvVars.appId!,
  measurementId: requiredEnvVars.measurementId!
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

if (typeof window !== "undefined") {
  const isDevelopment = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  if (isDevelopment) {
    const useEmulator = import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true";
    if (useEmulator) {
      import("firebase/functions").then(({connectFunctionsEmulator}) => {
        connectFunctionsEmulator(functions, "localhost", 5001);
        console.log("🔧 Firebase Functions conectado ao emulador local");
      });
    }
  }
}

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

export { auth, googleProvider, analytics, db, storage, functions };