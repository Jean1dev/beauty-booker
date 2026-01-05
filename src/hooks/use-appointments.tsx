import { useState, useEffect, useCallback } from "react";
import { getAppointmentsByUserId, Appointment } from "@/services/appointments";

interface UseAppointmentsProps {
  userId: string | null;
}

export const useAppointments = ({ userId }: UseAppointmentsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAppointmentsByUserId(userId);
      setAppointments(data);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error("Erro ao carregar agendamentos");
      setError(error);
      console.error("Erro ao carregar agendamentos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  return {
    appointments,
    isLoading,
    error,
    refetch: loadAppointments,
  };
};

