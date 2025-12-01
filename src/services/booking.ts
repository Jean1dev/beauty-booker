import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserServices, Service } from "@/services/user-services";
import { getAvailability, Availability } from "@/services/availability";

export interface BookingUserData {
  userId: string;
  userLink: string;
}

export interface BookingData {
  userId: string;
  services: Service[];
  availability: Availability;
}

export const getUserIdByLink = async (userLink: string): Promise<string | null> => {
  try {
    const preferencesRef = collection(db, "user-preferences");
    const q = query(preferencesRef, where("userLink", "==", userLink));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return data.userId || null;
  } catch (error) {
    console.error("Erro ao buscar usuário pelo link:", error);
    throw error;
  }
};

export const getBookingData = async (userLink: string): Promise<BookingData | null> => {
  try {
    const userId = await getUserIdByLink(userLink);
    
    if (!userId) {
      return null;
    }
    
    const [services, availability] = await Promise.all([
      getUserServices(userId),
      getAvailability(userId),
    ]);
    
    return {
      userId,
      services,
      availability,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de agendamento:", error);
    throw error;
  }
};

