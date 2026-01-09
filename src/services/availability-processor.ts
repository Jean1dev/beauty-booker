import { DaySchedule, HolidayConfig, Availability } from "@/services/availability";
import { Service } from "@/services/user-services";
import { format, addDays, isAfter, parseISO, isSameDay, startOfDay } from "date-fns";

export interface AvailableSlot {
  date: string;
  time: string;
  dateTime: Date;
}

export interface ProcessedAvailability {
  availableSlots: AvailableSlot[];
  enabledDays: DaySchedule[];
}

const getEnabledDays = (schedule: DaySchedule[]): DaySchedule[] => {
  return schedule.filter((day) => day.enabled);
};

const removeHolidays = (
  slots: AvailableSlot[],
  holidays: HolidayConfig[],
  holidaysEnabled: boolean
): AvailableSlot[] => {
  if (!holidaysEnabled || !holidays || holidays.length === 0) {
    return slots;
  }

  const enabledHolidays = holidays.filter((holiday) => holiday.enabled);
  
  if (enabledHolidays.length === 0) {
    return slots;
  }

  return slots.filter((slot) => {
    const slotDate = startOfDay(slot.dateTime);
    
    return !enabledHolidays.some((holiday) => {
      const holidayDate = startOfDay(parseISO(holiday.date));
      return isSameDay(slotDate, holidayDate);
    });
  });
};

const removeExcludedDays = (
  slots: AvailableSlot[],
  excludedDays: string[]
): AvailableSlot[] => {
  if (!excludedDays || excludedDays.length === 0) {
    return slots;
  }

  const excludedSet = new Set(excludedDays);

  return slots.filter((slot) => {
    return !excludedSet.has(slot.date);
  });
};

const applyAdvanceDays = (
  slots: AvailableSlot[],
  advanceDays: number
): AvailableSlot[] => {
  if (advanceDays <= 0) {
    return slots;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = addDays(today, advanceDays);
  const minDateStart = startOfDay(minDate);
  const minTimestamp = minDateStart.getTime();

  return slots.filter((slot) => {
    const slotDate = startOfDay(slot.dateTime);
    const slotTimestamp = slotDate.getTime();
    return slotTimestamp >= minTimestamp;
  });
};

const removeBookedAppointments = (
  slots: AvailableSlot[],
  bookedSlots: { date: string; time: string }[]
): AvailableSlot[] => {
  if (!bookedSlots || bookedSlots.length === 0) {
    return slots;
  }

  const normalizeTime = (time: string): string => {
    const trimmed = time.trim();
    if (trimmed.length === 4 && !trimmed.includes(":")) {
      return `${trimmed.slice(0, 2)}:${trimmed.slice(2)}`;
    }
    return trimmed;
  };

  const normalizeDate = (date: string): string => {
    return date.trim();
  };

  const bookedSet = new Set(
    bookedSlots.map((slot) => {
      const date = normalizeDate(slot.date);
      const time = normalizeTime(slot.time);
      return `${date}-${time}`;
    })
  );

  return slots.filter((slot) => {
    const slotKey = `${normalizeDate(slot.date)}-${normalizeTime(slot.time)}`;
    const isBooked = bookedSet.has(slotKey);
    return !isBooked;
  });
};

const filterSlotsByServiceDuration = (
  slots: AvailableSlot[],
  service: Service
): AvailableSlot[] => {
  if (!service.duration) {
    return slots;
  }

  let requiredSlots = 1;
  if (service.durationUnit === "hour") {
    requiredSlots = Math.ceil((service.duration * 60) / 30);
  } else {
    requiredSlots = Math.ceil(service.duration / 30);
  }

  if (requiredSlots <= 1) {
    return slots;
  }

  const slotsByDate = new Map<string, AvailableSlot[]>();
  slots.forEach((slot) => {
    if (!slotsByDate.has(slot.date)) {
      slotsByDate.set(slot.date, []);
    }
    slotsByDate.get(slot.date)!.push(slot);
  });

  const validSlots: AvailableSlot[] = [];

  slotsByDate.forEach((dateSlots) => {
    dateSlots.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    const availableTimesSet = new Set(dateSlots.map((s) => s.time));

    dateSlots.forEach((slot) => {
      let hasConsecutiveSlots = true;

      for (let i = 0; i < requiredSlots; i++) {
        const expectedTime = new Date(slot.dateTime);
        expectedTime.setMinutes(expectedTime.getMinutes() + i * 30);
        const expectedTimeStr = format(expectedTime, "HH:mm");

        if (!availableTimesSet.has(expectedTimeStr)) {
          hasConsecutiveSlots = false;
          break;
        }
      }

      if (hasConsecutiveSlots) {
        validSlots.push(slot);
      }
    });
  });

  return validSlots;
};

const generateTimeSlots = (
  startTime: string,
  endTime: string,
  date: Date
): AvailableSlot[] => {
  const slots: AvailableSlot[] = [];
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const start = new Date(date);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(date);
  end.setHours(endHour, endMin, 0, 0);

  const current = new Date(start);
  const slotDuration = 30;

  while (current < end) {
    const timeString = format(current, "HH:mm");
    slots.push({
      date: format(date, "yyyy-MM-dd"),
      time: timeString,
      dateTime: new Date(current),
    });

    current.setMinutes(current.getMinutes() + slotDuration);
  }

  return slots;
};

const getDayName = (date: Date): string => {
  const dayIndex = date.getDay();
  const dayNames: Record<number, string> = {
    0: "Domingo",
    1: "Segunda-feira",
    2: "Terça-feira",
    3: "Quarta-feira",
    4: "Quinta-feira",
    5: "Sexta-feira",
    6: "Sábado",
  };
  return dayNames[dayIndex];
};

const generateAvailableSlots = (
  enabledDays: DaySchedule[],
  startDate: Date,
  endDate: Date
): AvailableSlot[] => {
  const slots: AvailableSlot[] = [];

  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  while (currentDate <= end) {
    const dayName = getDayName(currentDate);
    const daySchedule = enabledDays.find((day) => day.day === dayName);
    
    if (daySchedule) {
      const daySlots = generateTimeSlots(
        daySchedule.start,
        daySchedule.end,
        new Date(currentDate)
      );
      slots.push(...daySlots);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
};

export const processAvailability = (
  availability: Availability,
  service: Service,
  startDate: Date = new Date(),
  endDate: Date = addDays(new Date(), 30),
  bookedSlots: { date: string; time: string }[] = [],
  excludedDays: string[] = []
): ProcessedAvailability => {
  const enabledDays = getEnabledDays(availability.schedule);
  
  let slots = generateAvailableSlots(enabledDays, startDate, endDate);
  
  slots = removeHolidays(
    slots,
    availability.holidays || [],
    availability.holidaysEnabled || false
  );
  
  slots = removeExcludedDays(slots, excludedDays);
  
  slots = applyAdvanceDays(slots, service.advanceDays);
  
  slots = removeBookedAppointments(slots, bookedSlots);
  
  slots = filterSlotsByServiceDuration(slots, service);
  
  slots.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  return {
    availableSlots: slots,
    enabledDays,
  };
};

