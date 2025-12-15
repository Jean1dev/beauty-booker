import { useState, useEffect } from "react";
import { getAvailability, saveAvailability, DaySchedule, DEFAULT_SCHEDULE, HolidayConfig, Availability } from "@/services/availability";
import { getExcludedDays, setExcludedDays as saveExcludedDays } from "@/services/excluded-days";

interface UseAvailabilityProps {
  userId: string | null;
}

export const useAvailability = ({ userId }: UseAvailabilityProps) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [holidays, setHolidays] = useState<HolidayConfig[]>([]);
  const [holidaysEnabled, setHolidaysEnabled] = useState(false);
  const [holidaysCountry, setHolidaysCountry] = useState("Brasil");
  const [excludedDays, setExcludedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!userId) {
        const localSchedule = localStorage.getItem("availability");
        if (localSchedule) {
          try {
            const parsed = JSON.parse(localSchedule) as DaySchedule[];
            setSchedule(parsed);
          } catch {
            setSchedule(DEFAULT_SCHEDULE);
          }
        } else {
          setSchedule(DEFAULT_SCHEDULE);
        }
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const localSchedule = localStorage.getItem("availability");
        if (localSchedule) {
          const parsed = JSON.parse(localSchedule) as DaySchedule[];
          setSchedule(parsed);
          setIsLoading(false);
          return;
        }

        const availabilityData = await getAvailability(userId);
        setSchedule(availabilityData.schedule);
        setHolidays(availabilityData.holidays || []);
        setHolidaysEnabled(availabilityData.holidaysEnabled ?? false);
        setHolidaysCountry(availabilityData.holidaysCountry || "Brasil");
        
        const excluded = await getExcludedDays(userId);
        setExcludedDays(excluded);
        
        localStorage.setItem("availability", JSON.stringify(availabilityData.schedule));
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error("Erro ao carregar disponibilidade");
        setError(error);
        
        const localSchedule = localStorage.getItem("availability");
        if (localSchedule) {
          try {
            const parsed = JSON.parse(localSchedule) as DaySchedule[];
            setSchedule(parsed);
          } catch {
            setSchedule(DEFAULT_SCHEDULE);
          }
        } else {
          setSchedule(DEFAULT_SCHEDULE);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [userId]);

  const updateSchedule = async (newSchedule: DaySchedule[]) => {
    try {
      setSchedule(newSchedule);
      localStorage.setItem("availability", JSON.stringify(newSchedule));

      if (userId) {
        await saveAvailability(userId, newSchedule, holidays, holidaysEnabled, holidaysCountry);
      }
    } catch (error) {
      console.error("Erro ao salvar disponibilidade:", error);
      throw error;
    }
  };

  const updateHolidays = async (
    newHolidays: HolidayConfig[],
    enabled?: boolean,
    country?: string
  ) => {
    try {
      setHolidays(newHolidays);
      if (enabled !== undefined) {
        setHolidaysEnabled(enabled);
      }
      if (country !== undefined) {
        setHolidaysCountry(country);
      }

      if (userId) {
        await saveAvailability(
          userId,
          schedule,
          newHolidays,
          enabled !== undefined ? enabled : holidaysEnabled,
          country !== undefined ? country : holidaysCountry
        );
      }
    } catch (error) {
      console.error("Erro ao salvar feriados:", error);
      throw error;
    }
  };

  const updateExcludedDays = async (newExcludedDays: string[]) => {
    try {
      if (userId) {
        await saveExcludedDays(userId, newExcludedDays);
        setExcludedDays(newExcludedDays);
      }
    } catch (error) {
      console.error("Erro ao salvar dias excluídos:", error);
      throw error;
    }
  };

  return {
    schedule,
    holidays,
    holidaysEnabled,
    holidaysCountry,
    excludedDays,
    isLoading,
    error,
    updateSchedule,
    updateHolidays,
    updateExcludedDays,
    setHolidaysEnabled,
    setHolidaysCountry,
  };
};

