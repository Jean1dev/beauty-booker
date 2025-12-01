import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Service {
  id: string;
  name: string;
  color: string;
  duration: number;
  durationUnit: "min" | "hour";
  advanceDays: number;
}

export interface UserService extends Service {
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = "user_services";

export const getUserServices = async (userId: string): Promise<Service[]> => {
  try {
    const servicesRef = collection(db, COLLECTION_NAME);
    const q = query(servicesRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const services: Service[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      services.push({
        id: doc.id,
        name: data.name,
        color: data.color || "#F4A69F",
        duration: data.duration,
        durationUnit: data.durationUnit || "min",
        advanceDays: data.advanceDays || 1,
      });
    });
    
    return services.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    throw error;
  }
};

export const createUserService = async (userId: string, service: Omit<Service, "id">): Promise<string> => {
  try {
    const servicesRef = collection(db, COLLECTION_NAME);
    const newServiceRef = doc(servicesRef);
    
    const userService: Omit<UserService, "id"> = {
      userId,
      name: service.name,
      color: service.color,
      duration: service.duration,
      durationUnit: service.durationUnit,
      advanceDays: service.advanceDays,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(newServiceRef, userService);
    return newServiceRef.id;
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    throw error;
  }
};

export const updateUserService = async (userId: string, service: Service): Promise<void> => {
  try {
    const serviceRef = doc(db, COLLECTION_NAME, service.id);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      throw new Error("Serviço não encontrado");
    }
    
    const data = serviceDoc.data() as UserService;
    if (data.userId !== userId) {
      throw new Error("Você não tem permissão para editar este serviço");
    }
    
    await setDoc(serviceRef, {
      ...data,
      name: service.name,
      color: service.color,
      duration: service.duration,
      durationUnit: service.durationUnit,
      advanceDays: service.advanceDays,
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    throw error;
  }
};

export const deleteUserService = async (userId: string, serviceId: string): Promise<void> => {
  try {
    const serviceRef = doc(db, COLLECTION_NAME, serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) {
      throw new Error("Serviço não encontrado");
    }
    
    const data = serviceDoc.data() as UserService;
    if (data.userId !== userId) {
      throw new Error("Você não tem permissão para excluir este serviço");
    }
    
    await deleteDoc(serviceRef);
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    throw error;
  }
};

