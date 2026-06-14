import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Download,
  Repeat,
  Users,
  UserX,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserServices } from "@/hooks/use-user-services";
import { useReports } from "@/hooks/use-reports";
import { percentChange, appointmentsToCsv } from "@/services/reports";
import { KpiCard } from "@/components/reports/KpiCard";
import {
  PeriodSelector,
  PeriodPreset,
  buildPeriod,
} from "@/components/reports/PeriodSelector";
import { AppointmentsTrendChart } from "@/components/reports/AppointmentsTrendChart";
import { ServicePopularityChart } from "@/components/reports/ServicePopularityChart";
import { StatusDistributionChart } from "@/components/reports/StatusDistributionChart";
import { TopClientsTable } from "@/components/reports/TopClientsTable";
import { format } from "date-fns";
import { toast } from "sonner";

const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-[20px] border border-border shadow-soft p-6">
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-4">
      {title}
    </p>
    {children}
  </div>
);

const Reports = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { services } = useUserServices({ userId: userData?.uid || null });

  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const [customPeriod, setCustomPeriod] = useState(buildPeriod("30d"));

  const period = preset === "custom" ? customPeriod : buildPeriod(preset);

  const { data, isLoading, error } = useReports({
    userId: userData?.uid || null,
    period,
    services,
  });

  const metrics = data?.metrics;
  const previous = data?.previousMetrics;

  const handleExport = () => {
    if (!data || data.appointments.length === 0) {
      toast.error("Não há agendamentos para exportar neste período");
      return;
    }
    const csv = appointmentsToCsv(data.appointments);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_${format(period.start, "yyyy-MM-dd")}_${format(period.end, "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  };

  const isEmpty = !isLoading && !error && (data?.appointments.length ?? 0) === 0;

  const kpis = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: "Total de agendamentos",
        value: String(metrics.totalAppointments),
        icon: CalendarCheck,
        deltaPct: previous ? percentChange(metrics.totalAppointments, previous.totalAppointments) : null,
      },
      {
        label: "Atendimentos concluídos",
        value: String(metrics.completed),
        icon: CheckCircle2,
        deltaPct: previous ? percentChange(metrics.completed, previous.completed) : null,
      },
      {
        label: "Taxa de comparecimento",
        value: `${(metrics.attendanceRate * 100).toFixed(0)}%`,
        icon: BarChart3,
        deltaPct: previous ? percentChange(metrics.attendanceRate, previous.attendanceRate) : null,
      },
      {
        label: "Taxa de cancelamento",
        value: `${(metrics.cancellationRate * 100).toFixed(0)}%`,
        icon: XCircle,
        deltaPct: previous ? percentChange(metrics.cancellationRate, previous.cancellationRate) : null,
        lowerIsBetter: true,
      },
      {
        label: "Faltas (não compareceu)",
        value: String(metrics.noShow),
        icon: UserX,
        deltaPct: previous ? percentChange(metrics.noShow, previous.noShow) : null,
        lowerIsBetter: true,
      },
      {
        label: "Clientes únicos",
        value: String(metrics.uniqueClients),
        icon: Users,
        deltaPct: previous ? percentChange(metrics.uniqueClients, previous.uniqueClients) : null,
      },
      {
        label: "Clientes recorrentes",
        value: String(metrics.returningClients),
        icon: Repeat,
      },
      {
        label: "Tempo agendado",
        value: formatMinutes(metrics.totalScheduledMinutes),
        icon: CalendarClock,
        hint: "Exclui cancelados",
      },
    ];
  }, [metrics, previous]);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="page-title">Relatórios</h1>
              <p className="page-subtitle">Acompanhe o desempenho do seu negócio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PeriodSelector
              preset={preset}
              period={period}
              onPresetChange={setPreset}
              onCustomChange={setCustomPeriod}
            />
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isLoading || isEmpty}
              className="border-primary/30 text-primary hover:bg-primary/5"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-24 text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
            <p className="text-sm">Carregando relatórios...</p>
          </div>
        ) : error ? (
          <div className="text-center py-24 text-destructive">
            <p className="text-sm">Erro ao carregar relatórios: {error.message}</p>
          </div>
        ) : isEmpty ? (
          <div className="bg-card rounded-[20px] border border-border shadow-soft text-center py-24 px-6 space-y-3">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Ainda não há agendamentos neste período.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Experimente selecionar um intervalo maior.
            </p>
          </div>
        ) : (
          <>
            {/* Alerta de faltas em aberto */}
            {metrics && metrics.openNoShow > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-foreground">
                    {metrics.openNoShow} atendimento(s) pendente(s) de baixa.
                  </span>{" "}
                  <span className="text-muted-foreground">
                    São agendamentos que já passaram e seguem como pendentes/confirmados.
                    Marque na Agenda se o cliente compareceu ou não.
                  </span>
                </div>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </div>

            {/* Tendência */}
            <Card title="Agendamentos ao longo do tempo">
              <AppointmentsTrendChart data={data?.timeSeries ?? []} />
            </Card>

            {/* Serviços + Status */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card title="Serviços mais populares">
                <ServicePopularityChart data={data?.serviceBreakdown ?? []} />
              </Card>
              <Card title="Distribuição por status">
                <StatusDistributionChart data={data?.statusDistribution ?? []} />
              </Card>
            </div>

            {/* Top clientes */}
            <Card title="Clientes que mais agendaram">
              <TopClientsTable clients={data?.topClients ?? []} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
