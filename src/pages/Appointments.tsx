import { useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, CalendarCheck, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments } from "@/hooks/use-appointments";
import { useUserServices } from "@/hooks/use-user-services";
import { useGoogleCalendar } from "@/hooks/use-google-calendar";
import { CalendarMonthlyView } from "@/components/calendar/CalendarMonthlyView";
import { CalendarWeeklyView } from "@/components/calendar/CalendarWeeklyView";
import { CalendarDailyView } from "@/components/calendar/CalendarDailyView";
import { toast } from "sonner";

const Appointments = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userData } = useAuth();
  const { appointments, isLoading, error, refetch } = useAppointments({
    userId: userData?.uid || null,
  });
  const { services } = useUserServices({ userId: userData?.uid || null });
  const { isConnected, isLoading: isLoadingCalendar, isConnecting, connect, disconnect } = useGoogleCalendar({
    userId: userData?.uid || null,
  });

  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorMessage = searchParams.get("message");
    if (connected === "success") {
      toast.success("Google Calendar conectado com sucesso!");
      setSearchParams({});
    } else if (connected === "error") {
      toast.error(errorMessage || "Erro ao conectar com Google Calendar");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const serviceColorMap = useMemo(() => {
    const map = new Map<string, string>();
    services.forEach((service) => map.set(service.id, service.color || "#C45C58"));
    return map;
  }, [services]);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
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
              <h1 className="page-title">Agenda</h1>
              <p className="page-subtitle">Visualize seus agendamentos</p>
            </div>
          </div>

          {!isLoadingCalendar && (
            <div>
              {isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/30"
                >
                  <CalendarX className="w-4 h-4" />
                  Desconectar Google
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connect}
                  disabled={isConnecting}
                  className="border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                >
                  <CalendarCheck className="w-4 h-4" />
                  {isConnecting ? "Conectando..." : "Conectar Google Agenda"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Calendar card */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <h2 className="font-medium text-foreground text-sm">Calendário de Agendamentos</h2>
              <p className="text-xs text-muted-foreground">
                Gerencie todos os seus agendamentos de forma visual
              </p>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-16 text-muted-foreground space-y-3">
                <Calendar className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm">Carregando agendamentos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-destructive">
                <p className="text-sm">Erro ao carregar agendamentos: {error.message}</p>
              </div>
            ) : (
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full max-w-xs grid-cols-3 mb-6 rounded-full bg-secondary p-1 h-auto">
                  <TabsTrigger value="monthly" className="rounded-full text-xs py-1.5">Mensal</TabsTrigger>
                  <TabsTrigger value="weekly" className="rounded-full text-xs py-1.5">Semanal</TabsTrigger>
                  <TabsTrigger value="daily" className="rounded-full text-xs py-1.5">Diária</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="mt-0">
                  <CalendarMonthlyView appointments={appointments} serviceColorMap={serviceColorMap} onAppointmentCancelled={refetch} />
                </TabsContent>
                <TabsContent value="weekly" className="mt-0">
                  <CalendarWeeklyView appointments={appointments} serviceColorMap={serviceColorMap} onAppointmentCancelled={refetch} />
                </TabsContent>
                <TabsContent value="daily" className="mt-0">
                  <CalendarDailyView appointments={appointments} serviceColorMap={serviceColorMap} onAppointmentCancelled={refetch} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Appointments;
