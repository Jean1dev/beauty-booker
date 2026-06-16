import { format, startOfWeek, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, getAppointmentsByDateRange } from "./appointments";
import { Service } from "./user-services";

export interface ReportPeriod {
  start: Date;
  end: Date;
}

export interface ReportMetrics {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  noShow: number;
  /** Agendamentos passados ainda em pending/confirmed (faltas em aberto, inferido). */
  openNoShow: number;
  /** cancelled / total (0..1). */
  cancellationRate: number;
  /** completed / (completed + cancelled + no_show) (0..1). */
  attendanceRate: number;
  uniqueClients: number;
  returningClients: number;
  totalScheduledMinutes: number;
}

export interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  color: string;
  count: number;
  percentage: number;
  totalMinutes: number;
}

export interface ClientSummary {
  clientName: string;
  clientPhone: string;
  appointmentsCount: number;
  lastAppointment: Date;
}

export interface TimeSeriesPoint {
  label: string;
  date: string;
  count: number;
}

export interface StatusSlice {
  status: Appointment["status"];
  label: string;
  count: number;
  color: string;
}

export type Granularity = "day" | "week" | "month";

const DEFAULT_SERVICE_COLOR = "#C45C58";

export const STATUS_LABELS: Record<Appointment["status"], string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const STATUS_COLORS: Record<Appointment["status"], string> = {
  pending: "#EAB308",
  confirmed: "#22C55E",
  completed: "#3B82F6",
  cancelled: "#EF4444",
  no_show: "#F97316",
};

/** Normaliza telefone para identidade de cliente (somente dígitos). */
const normalizePhone = (phone: string): string => (phone || "").replace(/\D/g, "");

const getMinutes = (appt: Appointment): number => {
  if (!appt.duration) return 0;
  return appt.durationUnit === "hour" ? appt.duration * 60 : appt.duration;
};

/**
 * Calcula o período imediatamente anterior, de mesma duração, para comparação.
 */
export const getPreviousPeriod = (period: ReportPeriod): ReportPeriod => {
  const durationMs = period.end.getTime() - period.start.getTime();
  // -1ms no fim evita sobreposição: getAppointmentsByDateRange é inclusivo nas
  // duas pontas, então um agendamento exatamente em period.start não pode cair
  // no período atual e no anterior ao mesmo tempo.
  return {
    start: new Date(period.start.getTime() - durationMs),
    end: new Date(period.start.getTime() - 1),
  };
};

/** Escolhe a granularidade do gráfico de tendência conforme o tamanho do período. */
export const pickGranularity = (period: ReportPeriod): Granularity => {
  const days = differenceInCalendarDays(period.end, period.start);
  if (days <= 31) return "day";
  if (days <= 92) return "week";
  return "month";
};

export const computeMetrics = (appts: Appointment[], now: Date = new Date()): ReportMetrics => {
  const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
  let openNoShow = 0;
  let totalScheduledMinutes = 0;

  const phoneCounts = new Map<string, number>();

  for (const appt of appts) {
    counts[appt.status] = (counts[appt.status] ?? 0) + 1;

    if (
      (appt.status === "pending" || appt.status === "confirmed") &&
      appt.dateTime.toDate().getTime() < now.getTime()
    ) {
      openNoShow += 1;
    }

    if (appt.status !== "cancelled") {
      totalScheduledMinutes += getMinutes(appt);
    }

    const phone = normalizePhone(appt.clientPhone);
    if (phone) {
      phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
    }
  }

  const total = appts.length;
  const attendanceDenominator = counts.completed + counts.cancelled + counts.no_show;
  const uniqueClients = phoneCounts.size;
  let returningClients = 0;
  phoneCounts.forEach((count) => {
    if (count >= 2) returningClients += 1;
  });

  return {
    totalAppointments: total,
    completed: counts.completed,
    cancelled: counts.cancelled,
    pending: counts.pending,
    confirmed: counts.confirmed,
    noShow: counts.no_show,
    openNoShow,
    cancellationRate: total > 0 ? counts.cancelled / total : 0,
    attendanceRate: attendanceDenominator > 0 ? counts.completed / attendanceDenominator : 0,
    uniqueClients,
    returningClients,
    totalScheduledMinutes,
  };
};

export const computeServiceBreakdown = (
  appts: Appointment[],
  services: Service[]
): ServiceBreakdown[] => {
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const grouped = new Map<string, ServiceBreakdown>();

  for (const appt of appts) {
    const service = serviceMap.get(appt.serviceId);
    const key = appt.serviceId || appt.serviceName;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalMinutes += getMinutes(appt);
    } else {
      grouped.set(key, {
        serviceId: appt.serviceId,
        serviceName: service?.name ?? appt.serviceName ?? "Serviço removido",
        color: service?.color ?? DEFAULT_SERVICE_COLOR,
        count: 1,
        percentage: 0,
        totalMinutes: getMinutes(appt),
      });
    }
  }

  const total = appts.length;
  const result = Array.from(grouped.values());
  result.forEach((item) => {
    item.percentage = total > 0 ? item.count / total : 0;
  });

  return result.sort((a, b) => b.count - a.count);
};

export const computeTopClients = (appts: Appointment[], limit = 10): ClientSummary[] => {
  const grouped = new Map<string, ClientSummary>();

  for (const appt of appts) {
    const phone = normalizePhone(appt.clientPhone);
    const key = phone || appt.clientName;
    if (!key) continue;

    const date = appt.dateTime.toDate();
    const existing = grouped.get(key);
    if (existing) {
      existing.appointmentsCount += 1;
      if (date > existing.lastAppointment) {
        existing.lastAppointment = date;
        existing.clientName = appt.clientName;
      }
    } else {
      grouped.set(key, {
        clientName: appt.clientName,
        clientPhone: appt.clientPhone,
        appointmentsCount: 1,
        lastAppointment: date,
      });
    }
  }

  return Array.from(grouped.values())
    .sort(
      (a, b) =>
        b.appointmentsCount - a.appointmentsCount ||
        b.lastAppointment.getTime() - a.lastAppointment.getTime()
    )
    .slice(0, limit);
};

const bucketKey = (date: Date, granularity: Granularity): { key: string; label: string } => {
  switch (granularity) {
    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return { key: format(weekStart, "yyyy-MM-dd"), label: format(weekStart, "dd/MM") };
    }
    case "month":
      return { key: format(date, "yyyy-MM"), label: format(date, "MMM/yy", { locale: ptBR }) };
    case "day":
    default:
      return { key: format(date, "yyyy-MM-dd"), label: format(date, "dd/MM") };
  }
};

export const computeTimeSeries = (
  appts: Appointment[],
  granularity: Granularity
): TimeSeriesPoint[] => {
  const grouped = new Map<string, TimeSeriesPoint>();

  for (const appt of appts) {
    const { key, label } = bucketKey(appt.dateTime.toDate(), granularity);
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(key, { date: key, label, count: 1 });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
};

export const computeStatusDistribution = (appts: Appointment[]): StatusSlice[] => {
  const order: Appointment["status"][] = [
    "completed",
    "confirmed",
    "pending",
    "no_show",
    "cancelled",
  ];
  const counts = new Map<Appointment["status"], number>();
  for (const appt of appts) {
    counts.set(appt.status, (counts.get(appt.status) ?? 0) + 1);
  }

  return order
    .map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
      color: STATUS_COLORS[status],
    }))
    .filter((slice) => slice.count > 0);
};

/**
 * Busca os agendamentos do período atual e do período anterior (mesma duração)
 * para alimentar todos os cálculos e comparações do relatório.
 */
export const getReportData = async (
  userId: string,
  period: ReportPeriod
): Promise<{ current: Appointment[]; previous: Appointment[] }> => {
  const previousPeriod = getPreviousPeriod(period);
  const [current, previous] = await Promise.all([
    getAppointmentsByDateRange(userId, period.start, period.end),
    getAppointmentsByDateRange(userId, previousPeriod.start, previousPeriod.end),
  ]);
  return { current, previous };
};

/** Variação percentual entre dois valores (null quando a base é zero). */
export const percentChange = (current: number, previous: number): number | null => {
  if (previous === 0) return null;
  return (current - previous) / previous;
};

const csvEscape = (value: string | number): string => {
  const str = String(value ?? "");
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/** Gera o conteúdo CSV da lista de agendamentos de um período. */
export const appointmentsToCsv = (appts: Appointment[]): string => {
  const header = ["Data", "Horário", "Cliente", "Telefone", "Serviço", "Status", "Duração (min)"];
  const rows = appts
    .slice()
    .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis())
    .map((appt) => {
      const date = appt.dateTime.toDate();
      return [
        format(date, "dd/MM/yyyy"),
        format(date, "HH:mm"),
        appt.clientName,
        appt.clientPhone,
        appt.serviceName,
        STATUS_LABELS[appt.status] ?? appt.status,
        getMinutes(appt),
      ]
        .map(csvEscape)
        .join(",");
    });
  return [header.map(csvEscape).join(","), ...rows].join("\n");
};
