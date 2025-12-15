import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { startOfDay } from "date-fns";

const COLLECTION_NAME = "excludedDays";

export interface ExcludedDay {
  id?: string;
  userId: string;
  date: string;
  createdAt?: Timestamp;
}

export const getExcludedDays = async (userId: string, fromDate?: Date): Promise<string[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const excludedDays: string[] = [];
    const startDate = fromDate ? startOfDay(fromDate) : startOfDay(new Date());
    const dateString = startDate.toISOString().split("T")[0];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.date && data.date >= dateString) {
        excludedDays.push(data.date);
      }
    });

    return excludedDays.sort();
  } catch (error) {
    console.error("Erro ao buscar dias excluídos:", error);
    return [];
  }
};

export const addExcludedDay = async (userId: string, date: string): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      date,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Erro ao adicionar dia excluído:", error);
    throw error;
  }
};

export const removeExcludedDay = async (userId: string, date: string): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("date", "==", date)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteDoc(doc(db, COLLECTION_NAME, docSnapshot.id))
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Erro ao remover dia excluído:", error);
    throw error;
  }
};

export const setExcludedDays = async (userId: string, dates: string[]): Promise<void> => {
  try {
    const currentExcludedDays = await getExcludedDays(userId);
    
    const datesToAdd = dates.filter((date) => !currentExcludedDays.includes(date));
    const datesToRemove = currentExcludedDays.filter((date) => !dates.includes(date));

    const addPromises = datesToAdd.map((date) => addExcludedDay(userId, date));
    const removePromises = datesToRemove.map((date) => removeExcludedDay(userId, date));

    await Promise.all([...addPromises, ...removePromises]);
  } catch (error) {
    console.error("Erro ao atualizar dias excluídos:", error);
    throw error;
  }
};

