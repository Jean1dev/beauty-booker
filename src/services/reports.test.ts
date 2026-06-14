import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  computeMetrics,
  computeServiceBreakdown,
  computeTopClients,
  computeTimeSeries,
  computeStatusDistribution,
  getPreviousPeriod,
  pickGranularity,
  percentChange,
  appointmentsToCsv,
} from "./reports";
import { Appointment } from "./appointments";
import { Service } from "./user-services";

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => {
  const date = overrides.dateTime?.toDate() ?? new Date("2026-06-10T14:00:00");
  return {
    id: Math.random().toString(36).slice(2),
    userId: "user-1",
    serviceId: "svc-1",
    serviceName: "Corte",
    clientName: "Ana",
    clientPhone: "11999990000",
    date: "2026-06-10",
    time: "14:00",
    dateTime: Timestamp.fromDate(date),
    duration: 30,
    durationUnit: "min",
    status: "completed",
    createdAt: Timestamp.fromDate(date),
    updatedAt: Timestamp.fromDate(date),
    ...overrides,
  };
};

const services: Service[] = [
  { id: "svc-1", name: "Corte", color: "#111111", duration: 30, durationUnit: "min", advanceDays: 1 },
  { id: "svc-2", name: "Coloração", color: "#222222", duration: 2, durationUnit: "hour", advanceDays: 1 },
];

describe("computeMetrics", () => {
  it("retorna zeros para período vazio", () => {
    const m = computeMetrics([]);
    expect(m.totalAppointments).toBe(0);
    expect(m.cancellationRate).toBe(0);
    expect(m.attendanceRate).toBe(0);
    expect(m.uniqueClients).toBe(0);
    expect(m.returningClients).toBe(0);
  });

  it("conta status, cancelamento e comparecimento", () => {
    const appts = [
      makeAppointment({ status: "completed" }),
      makeAppointment({ status: "completed" }),
      makeAppointment({ status: "cancelled" }),
      makeAppointment({ status: "no_show" }),
    ];
    const m = computeMetrics(appts);
    expect(m.totalAppointments).toBe(4);
    expect(m.completed).toBe(2);
    expect(m.cancelled).toBe(1);
    expect(m.noShow).toBe(1);
    expect(m.cancellationRate).toBeCloseTo(1 / 4);
    // completed / (completed + cancelled + no_show) = 2 / 4
    expect(m.attendanceRate).toBeCloseTo(2 / 4);
  });

  it("infere faltas em aberto (passado e ainda pending/confirmed)", () => {
    const now = new Date("2026-06-15T00:00:00");
    const appts = [
      makeAppointment({ status: "pending", dateTime: Timestamp.fromDate(new Date("2026-06-10T14:00:00")) }),
      makeAppointment({ status: "confirmed", dateTime: Timestamp.fromDate(new Date("2026-06-11T14:00:00")) }),
      // futuro: não conta como falta em aberto
      makeAppointment({ status: "confirmed", dateTime: Timestamp.fromDate(new Date("2026-06-20T14:00:00")) }),
      // concluído no passado: não conta
      makeAppointment({ status: "completed", dateTime: Timestamp.fromDate(new Date("2026-06-09T14:00:00")) }),
    ];
    const m = computeMetrics(appts, now);
    expect(m.openNoShow).toBe(2);
  });

  it("conta clientes únicos e recorrentes por telefone normalizado", () => {
    const appts = [
      makeAppointment({ clientPhone: "(11) 99999-0000" }),
      makeAppointment({ clientPhone: "11999990000" }),
      makeAppointment({ clientPhone: "11888887777" }),
    ];
    const m = computeMetrics(appts);
    expect(m.uniqueClients).toBe(2);
    expect(m.returningClients).toBe(1);
  });

  it("exclui cancelados do tempo agendado e converte horas", () => {
    const appts = [
      makeAppointment({ duration: 30, durationUnit: "min", status: "completed" }),
      makeAppointment({ duration: 2, durationUnit: "hour", status: "confirmed" }),
      makeAppointment({ duration: 60, durationUnit: "min", status: "cancelled" }),
    ];
    const m = computeMetrics(appts);
    expect(m.totalScheduledMinutes).toBe(30 + 120);
  });
});

describe("computeServiceBreakdown", () => {
  it("agrupa por serviço, ordena por contagem e calcula percentual", () => {
    const appts = [
      makeAppointment({ serviceId: "svc-1", serviceName: "Corte" }),
      makeAppointment({ serviceId: "svc-2", serviceName: "Coloração", duration: 2, durationUnit: "hour" }),
      makeAppointment({ serviceId: "svc-2", serviceName: "Coloração", duration: 2, durationUnit: "hour" }),
    ];
    const result = computeServiceBreakdown(appts, services);
    expect(result[0].serviceId).toBe("svc-2");
    expect(result[0].count).toBe(2);
    expect(result[0].percentage).toBeCloseTo(2 / 3);
    expect(result[0].color).toBe("#222222");
    expect(result[0].totalMinutes).toBe(240);
  });

  it("usa fallback para serviço removido", () => {
    const appts = [makeAppointment({ serviceId: "deleted", serviceName: "Antigo" })];
    const result = computeServiceBreakdown(appts, services);
    expect(result[0].serviceName).toBe("Antigo");
    expect(result[0].color).toBeTruthy();
  });
});

describe("computeTopClients", () => {
  it("ordena por número de agendamentos e respeita o limite", () => {
    const appts = [
      makeAppointment({ clientName: "Ana", clientPhone: "111", dateTime: Timestamp.fromDate(new Date("2026-06-01T10:00:00")) }),
      makeAppointment({ clientName: "Ana", clientPhone: "111", dateTime: Timestamp.fromDate(new Date("2026-06-10T10:00:00")) }),
      makeAppointment({ clientName: "Bia", clientPhone: "222", dateTime: Timestamp.fromDate(new Date("2026-06-05T10:00:00")) }),
    ];
    const result = computeTopClients(appts, 1);
    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe("Ana");
    expect(result[0].appointmentsCount).toBe(2);
    expect(result[0].lastAppointment).toEqual(new Date("2026-06-10T10:00:00"));
  });
});

describe("computeTimeSeries", () => {
  it("agrupa por dia e ordena cronologicamente", () => {
    const appts = [
      makeAppointment({ dateTime: Timestamp.fromDate(new Date("2026-06-10T09:00:00")) }),
      makeAppointment({ dateTime: Timestamp.fromDate(new Date("2026-06-10T15:00:00")) }),
      makeAppointment({ dateTime: Timestamp.fromDate(new Date("2026-06-08T15:00:00")) }),
    ];
    const series = computeTimeSeries(appts, "day");
    expect(series).toHaveLength(2);
    expect(series[0].date).toBe("2026-06-08");
    expect(series[1].count).toBe(2);
  });
});

describe("computeStatusDistribution", () => {
  it("inclui apenas status presentes, na ordem definida", () => {
    const appts = [
      makeAppointment({ status: "completed" }),
      makeAppointment({ status: "cancelled" }),
    ];
    const dist = computeStatusDistribution(appts);
    expect(dist.map((s) => s.status)).toEqual(["completed", "cancelled"]);
  });
});

describe("getPreviousPeriod", () => {
  it("retorna período anterior de mesma duração", () => {
    const period = { start: new Date("2026-06-08T00:00:00"), end: new Date("2026-06-15T00:00:00") };
    const prev = getPreviousPeriod(period);
    expect(prev.end).toEqual(period.start);
    expect(prev.start).toEqual(new Date("2026-06-01T00:00:00"));
  });
});

describe("pickGranularity", () => {
  it("escolhe granularidade conforme tamanho do período", () => {
    expect(pickGranularity({ start: new Date("2026-06-01"), end: new Date("2026-06-20") })).toBe("day");
    expect(pickGranularity({ start: new Date("2026-04-01"), end: new Date("2026-06-01") })).toBe("week");
    expect(pickGranularity({ start: new Date("2026-01-01"), end: new Date("2026-12-31") })).toBe("month");
  });
});

describe("percentChange", () => {
  it("retorna null quando a base é zero", () => {
    expect(percentChange(5, 0)).toBeNull();
  });
  it("calcula variação relativa", () => {
    expect(percentChange(150, 100)).toBeCloseTo(0.5);
    expect(percentChange(50, 100)).toBeCloseTo(-0.5);
  });
});

describe("appointmentsToCsv", () => {
  it("gera cabeçalho e linhas com escaping", () => {
    const csv = appointmentsToCsv([
      makeAppointment({ clientName: "Ana, Maria", status: "completed" }),
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Cliente");
    expect(lines[1]).toContain('"Ana, Maria"');
    expect(lines[1]).toContain("Concluído");
  });
});
