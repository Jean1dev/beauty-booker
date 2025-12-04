import { useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, CalendarCheck, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { appointments, isLoading, error } = useAppointments({
    userId: userData?.uid || null,
  });
  const { services } = useUserServices({
    userId: userData?.uid || null,
  });
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
    services.forEach((service) => {
      map.set(service.id, service.color || "#F4A69F");
    });
    return map;
  }, [services]);

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="shadow-soft"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Agenda
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize seus agendamentos
            </p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Calendário de Agendamentos
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Gerencie todos os seus agendamentos de forma visual
                </CardDescription>
              </div>
              {!isLoadingCalendar && (
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={disconnect}
                      className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                    >
                      <CalendarX className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={connect}
                      disabled={isConnecting}
                      className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                    >
                      <CalendarCheck className="w-4 h-4 mr-2" />
                      {isConnecting ? "Conectando..." : "Conectar com Google Agenda"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto opacity-50 mb-4" />
                <p>Carregando agendamentos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>Erro ao carregar agendamentos: {error.message}</p>
              </div>
            ) : (
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                  <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  <TabsTrigger value="weekly">Semanal</TabsTrigger>
                  <TabsTrigger value="daily">Diária</TabsTrigger>
                </TabsList>
                <TabsContent value="monthly" className="mt-0">
                  <CalendarMonthlyView appointments={appointments} serviceColorMap={serviceColorMap} />
                </TabsContent>
                <TabsContent value="weekly" className="mt-0">
                  <CalendarWeeklyView appointments={appointments} serviceColorMap={serviceColorMap} />
                </TabsContent>
                <TabsContent value="daily" className="mt-0">
                  <CalendarDailyView appointments={appointments} serviceColorMap={serviceColorMap} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
