import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface DaySchedule {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

export interface HolidayConfig {
  date: string;
  name: string;
  enabled: boolean;
}

export interface Availability {
  userId: string;
  schedule: DaySchedule[];
  holidays?: HolidayConfig[];
  holidaysEnabled?: boolean;
  holidaysCountry?: string;
}

const COLLECTION_NAME = "availability";

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Segunda-feira", enabled: true, start: "08:00", end: "18:00" },
  { day: "Terça-feira", enabled: true, start: "08:00", end: "18:00" },
  { day: "Quarta-feira", enabled: true, start: "08:00", end: "18:00" },
  { day: "Quinta-feira", enabled: true, start: "08:00", end: "18:00" },
  { day: "Sexta-feira", enabled: true, start: "08:00", end: "18:00" },
  { day: "Sábado", enabled: false, start: "09:00", end: "14:00" },
  { day: "Domingo", enabled: false, start: "09:00", end: "14:00" },
];

export const getAvailability = async (userId: string): Promise<Availability> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Availability;
      return {
        userId: data.userId || userId,
        schedule: data.schedule || DEFAULT_SCHEDULE,
        holidays: data.holidays || [],
        holidaysEnabled: data.holidaysEnabled ?? false,
        holidaysCountry: data.holidaysCountry || "Brasil",
      };
    }
    
    return {
      userId,
      schedule: DEFAULT_SCHEDULE,
      holidays: [],
      holidaysEnabled: false,
      holidaysCountry: "Brasil",
    };
  } catch (error) {
    console.error("Erro ao buscar disponibilidade:", error);
    throw error;
  }
};

export const saveAvailability = async (
  userId: string,
  schedule: DaySchedule[],
  holidays?: HolidayConfig[],
  holidaysEnabled?: boolean,
  holidaysCountry?: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const data: Availability = {
      userId,
      schedule,
    };

    if (holidays !== undefined) {
      data.holidays = holidays;
    }
    if (holidaysEnabled !== undefined) {
      data.holidaysEnabled = holidaysEnabled;
    }
    if (holidaysCountry !== undefined) {
      data.holidaysCountry = holidaysCountry;
    }

    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar disponibilidade:", error);
    throw error;
  }
};

export { DEFAULT_SCHEDULE };

