export interface Holiday {
  date: string;
  name: string;
  type: string;
}

const BRASIL_API_BASE = "https://brasilapi.com.br/api/feriados/v1";

export const getHolidays = async (year: number): Promise<Holiday[]> => {
  try {
    const response = await fetch(`${BRASIL_API_BASE}/${year}`);
    if (!response.ok) {
      throw new Error("Erro ao buscar feriados");
    }
    const data = await response.json();
    return data as Holiday[];
  } catch (error) {
    console.error("Erro ao buscar feriados:", error);
    return [];
  }
};

export const getHolidaysForCurrentAndNextYear = async (): Promise<Holiday[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;
  const oneYearFromNow = new Date(today);
  oneYearFromNow.setFullYear(currentYear + 1);

  try {
    const [currentYearHolidays, nextYearHolidays] = await Promise.all([
      getHolidays(currentYear),
      getHolidays(nextYear),
    ]);

    const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
    
    const futureHolidays = allHolidays.filter((holiday) => {
      const holidayDate = new Date(holiday.date);
      holidayDate.setHours(0, 0, 0, 0);
      return holidayDate >= today && holidayDate <= oneYearFromNow;
    });

    return futureHolidays.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  } catch (error) {
    console.error("Erro ao buscar feriados:", error);
    return [];
  }
};

