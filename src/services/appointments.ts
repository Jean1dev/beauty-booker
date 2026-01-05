import { collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, parseISO } from "date-fns";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export interface Appointment {
  id?: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
  date: string;
  time: string;
  dateTime: Timestamp;
  duration?: number;
  durationUnit?: "min" | "hour";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  googleCalendarEventId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COLLECTION_NAME = "appointments";

export const createAppointment = async (appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const appointmentsRef = collection(db, COLLECTION_NAME);
    const now = Timestamp.now();
    
    const appointmentData: any = {
      userId: appointment.userId,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      date: appointment.date,
      time: appointment.time,
      dateTime: appointment.dateTime,
      duration: appointment.duration,
      durationUnit: appointment.durationUnit,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    
    if (appointment.clientNotes && appointment.clientNotes.trim()) {
      appointmentData.clientNotes = appointment.clientNotes.trim();
    }
    
    const docRef = await addDoc(appointmentsRef, appointmentData);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    throw error;
  }
};

export const getAppointmentsByUserId = async (userId: string): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, COLLECTION_NAME);
    const q = query(appointmentsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const appointments: Appointment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      appointments.push({
        id: doc.id,
        ...data,
      } as Appointment);
    });
    
    return appointments.sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    throw error;
  }
};

export const getAppointmentsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Appointment[]> => {
  try {
    const appointmentsRef = collection(db, COLLECTION_NAME);
    const q = query(appointmentsRef, where("userId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const appointment: Appointment = {
        id: doc.id,
        userId: data.userId,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientNotes: data.clientNotes,
        date: data.date,
        time: data.time,
        dateTime: data.dateTime,
        duration: data.duration,
        durationUnit: data.durationUnit,
        status: data.status || "pending",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as Appointment;
      
      if (appointment.dateTime && 
          appointment.dateTime >= startTimestamp && 
          appointment.dateTime <= endTimestamp) {
        appointments.push(appointment);
      }
    });
    
    return appointments;
  } catch (error) {
    console.error("Erro ao buscar agendamentos por período:", error);
    return [];
  }
};

export const getBookedSlots = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; time: string }[]> => {
  try {
    const appointments = await getAppointmentsByDateRange(userId, startDate, endDate);
    const bookedSlots: { date: string; time: string }[] = [];
    
    appointments
      .filter((apt) => apt.status !== "cancelled")
      .forEach((apt) => {
        const appointmentDate = parseISO(apt.date);
        const [startHour, startMin] = apt.time.split(":").map(Number);
        const startDateTime = new Date(appointmentDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        let durationMinutes = 30;
        if (apt.duration && apt.durationUnit) {
          if (apt.durationUnit === "hour") {
            durationMinutes = apt.duration * 60;
          } else {
            durationMinutes = apt.duration;
          }
        }
        
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
        
        const currentSlot = new Date(startDateTime);
        const slotDuration = 30;
        
        while (currentSlot < endDateTime) {
          const dateStr = format(appointmentDate, "yyyy-MM-dd");
          const timeStr = format(currentSlot, "HH:mm");
          bookedSlots.push({ date: dateStr, time: timeStr });
          currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
        }
      });
    
    return bookedSlots;
  } catch (error) {
    console.error("Erro ao buscar slots ocupados:", error);
    return [];
  }
};

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    const cancelAppointmentFn = httpsCallable(functions, "cancelAppointment");
    await cancelAppointmentFn({ appointmentId });
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    throw error;
  }
};
