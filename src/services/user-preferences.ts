import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserPreferences {
  userId: string;
  userLink?: string;
  [key: string]: any;
}

const COLLECTION_NAME = "user-preferences";

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserPreferences;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar preferências do usuário:", error);
    throw error;
  }
};

export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, preferences.userId);
    await setDoc(docRef, preferences, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar preferências do usuário:", error);
    throw error;
  }
};

export const saveUserLink = async (userId: string, userLink: string): Promise<void> => {
  try {
    await saveUserPreferences({
      userId,
      userLink,
    });
  } catch (error) {
    console.error("Erro ao salvar link do usuário:", error);
    throw error;
  }
};

