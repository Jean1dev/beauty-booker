import { useState, useEffect } from "react";
import { User, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { toast } from "sonner";
import { trackLogin, trackLogout, setUserAnalytics, clearUserAnalytics } from "@/lib/analytics";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const data: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUserData(data);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("user", JSON.stringify(data));
        setUserAnalytics(firebaseUser.uid, {
          email: firebaseUser.email || undefined,
          display_name: firebaseUser.displayName || undefined,
        });
      } else {
        setUser(null);
        setUserData(null);
        localStorage.clear();
        clearUserAnalytics();
      }
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const data: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      };
      
      setUser(firebaseUser);
      setUserData(data);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(data));
      
      trackLogin("google");
      setUserAnalytics(firebaseUser.uid, {
        email: firebaseUser.email || undefined,
        display_name: firebaseUser.displayName || undefined,
      });
      
      toast.success("Login realizado com sucesso!");
      return firebaseUser;
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast.error(error.message || "Erro ao fazer login com Google");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
      setUserData(null);
      localStorage.clear();
      trackLogout();
      clearUserAnalytics();
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast.error(error.message || "Erro ao fazer logout");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    userData,
    isLoading,
    isCheckingAuth,
    isAuthenticated: !!user,
    loginWithGoogle,
    logout,
  };
};

