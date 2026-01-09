import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { processAvailability } from "./availability-processor";
import { Availability, HolidayConfig } from "./availability";
import { Service } from "./user-services";
import { format, addDays } from "date-fns";

describe("availability-processor", () => {
  const mockService: Service = {
    id: "service-1",
    name: "Serviço Teste",
    color: "#F4A69F",
    duration: 30,
    durationUnit: "min",
    advanceDays: 1,
  };

  const mockAvailability: Availability = {
    userId: "user-1",
    schedule: [
      { day: "Segunda-feira", enabled: true, start: "08:00", end: "18:00" },
      { day: "Terça-feira", enabled: true, start: "18:00", end: "20:00" },
      { day: "Quarta-feira", enabled: false, start: "08:00", end: "18:00" },
      { day: "Quinta-feira", enabled: true, start: "09:00", end: "17:00" },
      { day: "Sexta-feira", enabled: true, start: "08:00", end: "18:00" },
      { day: "Sábado", enabled: false, start: "09:00", end: "14:00" },
      { day: "Domingo", enabled: false, start: "09:00", end: "14:00" },
    ],
    holidaysEnabled: false,
    holidays: [],
  };

  const getNextTuesday = (fromDate: Date): Date => {
    const date = new Date(fromDate);
    const day = date.getDay();
    const diff = day <= 2 ? 2 - day : 9 - day;
    date.setDate(date.getDate() + diff);
    return date;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("processAvailability", () => {
    it("deve retornar slots disponíveis para dias habilitados", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const result = processAvailability(
        mockAvailability,
        mockService,
        startDate,
        endDate
      );

      expect(result.availableSlots.length).toBeGreaterThan(0);
      expect(result.enabledDays.length).toBe(4);
    });

    it("não deve retornar slots para dias desabilitados", () => {
      const startDate = new Date("2024-01-17");
      const endDate = new Date("2024-01-17");

      const result = processAvailability(
        mockAvailability,
        mockService,
        startDate,
        endDate
      );

      const quartaSlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-17"
      );
      expect(quartaSlots.length).toBe(0);
    });

    it("deve gerar slots de 30 minutos entre start e end", () => {
      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");

      const result = processAvailability(
        mockAvailability,
        mockService,
        tercaDate,
        tercaDate
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.length).toBe(4);
      expect(tercaSlots[0].time).toBe("18:00");
      expect(tercaSlots[1].time).toBe("18:30");
      expect(tercaSlots[2].time).toBe("19:00");
      expect(tercaSlots[3].time).toBe("19:30");
    });

    it("deve remover slots ocupados", () => {
      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");
      const bookedSlots = [{ date: tercaDateStr, time: "19:00" }];

      const result = processAvailability(
        mockAvailability,
        mockService,
        tercaDate,
        tercaDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.find((s) => s.time === "19:00")).toBeUndefined();
      expect(tercaSlots.find((s) => s.time === "18:00")).toBeDefined();
      expect(tercaSlots.find((s) => s.time === "18:30")).toBeDefined();
    });

    it("deve remover dias excluídos", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");
      const excludedDays = ["2024-01-16"];

      const result = processAvailability(
        mockAvailability,
        mockService,
        startDate,
        endDate,
        [],
        excludedDays
      );

      const excludedDaySlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );
      expect(excludedDaySlots.length).toBe(0);
    });

    it("deve aplicar advanceDays corretamente", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-20");
      const serviceWithAdvance: Service = {
        ...mockService,
        advanceDays: 2,
      };

      const result = processAvailability(
        mockAvailability,
        serviceWithAdvance,
        startDate,
        endDate
      );

      const today = new Date("2024-01-15");
      const minDate = addDays(today, 2);
      const minDateStr = format(minDate, "yyyy-MM-dd");

      const slotsBeforeMinDate = result.availableSlots.filter(
        (slot) => slot.date < minDateStr
      );
      expect(slotsBeforeMinDate.length).toBe(0);
    });

    it("deve remover feriados quando holidaysEnabled é true", () => {
      const holidays: HolidayConfig[] = [
        {
          date: "2024-01-16",
          name: "Feriado Teste",
          enabled: true,
        },
      ];

      const availabilityWithHolidays: Availability = {
        ...mockAvailability,
        holidaysEnabled: true,
        holidays,
      };

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const result = processAvailability(
        availabilityWithHolidays,
        mockService,
        startDate,
        endDate
      );

      const holidaySlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );
      expect(holidaySlots.length).toBe(0);
    });

    it("não deve remover feriados quando holidaysEnabled é false", () => {
      const holidays: HolidayConfig[] = [
        {
          date: "2024-01-16",
          name: "Feriado Teste",
          enabled: true,
        },
      ];

      const availabilityWithHolidays: Availability = {
        ...mockAvailability,
        holidaysEnabled: false,
        holidays,
      };

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const result = processAvailability(
        availabilityWithHolidays,
        mockService,
        startDate,
        endDate
      );

      const holidaySlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );
      expect(holidaySlots.length).toBeGreaterThan(0);
    });

    it("não deve remover feriados desabilitados mesmo com holidaysEnabled true", () => {
      const holidays: HolidayConfig[] = [
        {
          date: "2024-01-16",
          name: "Feriado Teste",
          enabled: false,
        },
      ];

      const availabilityWithHolidays: Availability = {
        ...mockAvailability,
        holidaysEnabled: true,
        holidays,
      };

      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const result = processAvailability(
        availabilityWithHolidays,
        mockService,
        startDate,
        endDate
      );

      const holidaySlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );
      expect(holidaySlots.length).toBeGreaterThan(0);
    });
  });

  describe("filterSlotsByServiceDuration", () => {
    it("deve filtrar slots que não têm duração suficiente para serviço de 1h30", () => {
      const service90min: Service = {
        ...mockService,
        duration: 90,
        durationUnit: "min",
      };

      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");

      const bookedSlots = [{ date: tercaDateStr, time: "19:00" }];

      const result = processAvailability(
        mockAvailability,
        service90min,
        tercaDate,
        tercaDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.find((s) => s.time === "18:00")).toBeUndefined();
      expect(tercaSlots.find((s) => s.time === "18:30")).toBeUndefined();
    });

    it("deve permitir slots com duração suficiente", () => {
      const service30min: Service = {
        ...mockService,
        duration: 30,
        durationUnit: "min",
      };

      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");

      const bookedSlots = [{ date: tercaDateStr, time: "19:00" }];

      const result = processAvailability(
        mockAvailability,
        service30min,
        tercaDate,
        tercaDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.find((s) => s.time === "18:00")).toBeDefined();
      expect(tercaSlots.find((s) => s.time === "18:30")).toBeDefined();
    });

    it("deve calcular corretamente slots necessários para serviço em horas", () => {
      const service2hours: Service = {
        ...mockService,
        duration: 2,
        durationUnit: "hour",
      };

      const startDate = new Date("2024-01-16");
      const endDate = new Date("2024-01-16");

      const bookedSlots = [{ date: "2024-01-16", time: "19:00" }];

      const result = processAvailability(
        mockAvailability,
        service2hours,
        startDate,
        endDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );

      expect(tercaSlots.length).toBe(0);
    });

    it("deve permitir serviço de 1h quando há espaço suficiente", () => {
      const service1hour: Service = {
        ...mockService,
        duration: 1,
        durationUnit: "hour",
      };

      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");

      const bookedSlots = [{ date: tercaDateStr, time: "19:30" }];

      const result = processAvailability(
        mockAvailability,
        service1hour,
        tercaDate,
        tercaDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.find((s) => s.time === "18:00")).toBeDefined();
      expect(tercaSlots.find((s) => s.time === "18:30")).toBeDefined();
    });

    it("não deve permitir serviço de 1h30 quando há agendamento no meio", () => {
      const service90min: Service = {
        ...mockService,
        duration: 90,
        durationUnit: "min",
      };

      const startDate = new Date("2024-01-16");
      const endDate = new Date("2024-01-16");

      const bookedSlots = [{ date: "2024-01-16", time: "19:00" }];

      const result = processAvailability(
        mockAvailability,
        service90min,
        startDate,
        endDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );

      const slot18h = tercaSlots.find((s) => s.time === "18:00");
      expect(slot18h).toBeUndefined();
    });

    it("deve retornar todos os slots quando serviço não tem duração definida", () => {
      const serviceNoDuration: Service = {
        ...mockService,
        duration: undefined as any,
      };

      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");

      const result = processAvailability(
        mockAvailability,
        serviceNoDuration,
        tercaDate,
        tercaDate
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.length).toBe(4);
    });
  });

  describe("removeBookedAppointments", () => {
    it("deve normalizar tempo sem dois pontos", () => {
      const startDate = new Date("2024-01-16");
      const endDate = new Date("2024-01-16");
      const bookedSlots = [{ date: "2024-01-16", time: "1900" }];

      const result = processAvailability(
        mockAvailability,
        mockService,
        startDate,
        endDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );

      expect(tercaSlots.find((s) => s.time === "19:00")).toBeUndefined();
    });

    it("deve normalizar data com espaços", () => {
      const startDate = new Date("2024-01-16");
      const endDate = new Date("2024-01-16");
      const bookedSlots = [{ date: " 2024-01-16 ", time: "19:00" }];

      const result = processAvailability(
        mockAvailability,
        mockService,
        startDate,
        endDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === "2024-01-16"
      );

      expect(tercaSlots.find((s) => s.time === "19:00")).toBeUndefined();
    });
  });

  describe("cenário completo - caso de uso real", () => {
    it("deve impedir agendamento de 1h30 às 18h quando há agendamento às 19h", () => {
      const service90min: Service = {
        id: "service-a",
        name: "Serviço A",
        color: "#F4A69F",
        duration: 90,
        durationUnit: "min",
        advanceDays: 1,
      };

      const availability: Availability = {
        userId: "user-1",
        schedule: [
          { day: "Segunda-feira", enabled: false, start: "08:00", end: "18:00" },
          { day: "Terça-feira", enabled: true, start: "18:00", end: "20:00" },
          { day: "Quarta-feira", enabled: false, start: "08:00", end: "18:00" },
          { day: "Quinta-feira", enabled: false, start: "08:00", end: "18:00" },
          { day: "Sexta-feira", enabled: false, start: "08:00", end: "18:00" },
          { day: "Sábado", enabled: false, start: "09:00", end: "14:00" },
          { day: "Domingo", enabled: false, start: "09:00", end: "14:00" },
        ],
        holidaysEnabled: false,
        holidays: [],
      };

      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");
      const bookedSlots = [{ date: tercaDateStr, time: "19:00" }];

      const result = processAvailability(
        availability,
        service90min,
        tercaDate,
        tercaDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      const slot18h = tercaSlots.find((s) => s.time === "18:00");
      expect(slot18h).toBeUndefined();

      const slot18h30 = tercaSlots.find((s) => s.time === "18:30");
      expect(slot18h30).toBeUndefined();
    });

    it("deve permitir múltiplos agendamentos quando há espaço suficiente", () => {
      const service30min: Service = {
        ...mockService,
        duration: 30,
        durationUnit: "min",
      };

      const baseDate = new Date("2024-01-15");
      const tercaDate = getNextTuesday(baseDate);
      const tercaDateStr = format(tercaDate, "yyyy-MM-dd");

      const bookedSlots = [
        { date: tercaDateStr, time: "19:00" },
        { date: tercaDateStr, time: "19:30" },
      ];

      const result = processAvailability(
        mockAvailability,
        service30min,
        tercaDate,
        tercaDate,
        bookedSlots
      );

      const tercaSlots = result.availableSlots.filter(
        (slot) => slot.date === tercaDateStr
      );

      expect(tercaSlots.find((s) => s.time === "18:00")).toBeDefined();
      expect(tercaSlots.find((s) => s.time === "18:30")).toBeDefined();
      expect(tercaSlots.find((s) => s.time === "19:00")).toBeUndefined();
      expect(tercaSlots.find((s) => s.time === "19:30")).toBeUndefined();
    });

    it("deve ordenar slots por data e hora", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-01-17");

      const result = processAvailability(
        mockAvailability,
        mockService,
        startDate,
        endDate
      );

      for (let i = 1; i < result.availableSlots.length; i++) {
        const prev = result.availableSlots[i - 1];
        const curr = result.availableSlots[i];

        const prevTime = prev.dateTime.getTime();
        const currTime = curr.dateTime.getTime();

        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });
});
