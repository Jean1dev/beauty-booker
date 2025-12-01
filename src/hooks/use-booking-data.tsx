import { useState, useEffect } from "react";
import { getBookingData } from "@/services/booking";
import { Service } from "@/services/user-services";
import { Availability } from "@/services/availability";
import { getBookedSlots } from "@/services/appointments";
import { addDays } from "date-fns";

interface UseBookingDataProps {
  userLink: string | null;
}

export const useBookingData = ({ userLink }: UseBookingDataProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ date: string; time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadBookingData = async () => {
      if (!userLink) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const data = await getBookingData(userLink);
        
        if (data) {
          setUserId(data.userId);
          setServices(data.services);
          setAvailability(data.availability);
          
          const startDate = new Date();
          const endDate = addDays(new Date(), 30);
          const booked = await getBookedSlots(data.userId, startDate, endDate);
          setBookedSlots(booked);
        } else {
          setError(new Error("Link de agendamento não encontrado"));
        }
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error("Erro ao carregar dados de agendamento");
        setError(error);
        console.error("Erro ao carregar dados de agendamento:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [userLink]);

  return {
    services,
    availability,
    userId,
    bookedSlots,
    isLoading,
    error,
  };
};

