import { useState } from "react";
import { format, isSameDay, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/services/appointments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Clock, User, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentDetailsSheet } from "./AppointmentDetailsSheet";

interface CalendarDailyViewProps {
  appointments: Appointment[];
  serviceColorMap: Map<string, string>;
}

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const VISIBLE_HOURS = ALL_HOURS.filter((hour) => hour >= 7);

export const CalendarDailyView = ({ appointments, serviceColorMap }: CalendarDailyViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getAppointmentsForDay = (day: Date) => {
    return appointments
      .filter((apt) => {
        const aptDate = apt.dateTime.toDate();
        return isSameDay(aptDate, day) && apt.status !== "cancelled";
      })
      .sort((a, b) => {
        const timeA = a.time.split(":").map(Number);
        const timeB = b.time.split(":").map(Number);
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        return minutesA - minutesB;
      });
  };

  const getAppointmentsForHour = (day: Date, hour: number) => {
    return getAppointmentsForDay(day).filter((apt) => {
      const aptDate = apt.dateTime.toDate();
      return aptDate.getHours() === hour;
    });
  };

  const getServiceColor = (serviceId: string) => {
    return serviceColorMap.get(serviceId) || "#F4A69F";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const previousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const nextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const dayAppointments = getAppointmentsForDay(currentDate);
  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold ml-4">
            {format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
          </h2>
          {isToday && (
            <Badge variant="outline" className="ml-2">
              Hoje
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {VISIBLE_HOURS.map((hour) => {
                  const hourAppointments = getAppointmentsForHour(currentDate, hour);

                  return (
                    <div
                      key={hour}
                      className="border-b border-l-4 border-l-border pl-4 pr-4 py-2 min-h-[80px] relative"
                    >
                      <div className="absolute left-0 top-2 -ml-2.5 w-5 h-5 rounded-full bg-background border-2 border-primary" />
                      <div className="text-sm font-semibold text-muted-foreground mb-2">
                        {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                      </div>
                      <div className="space-y-2">
                        {hourAppointments.map((apt) => {
                          const serviceColor = getServiceColor(apt.serviceId);
                          return (
                          <Card
                            key={apt.id}
                            className="border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            style={{ borderLeftColor: serviceColor }}
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setIsSheetOpen(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold">{apt.time}</span>
                                </div>
                                {getStatusBadge(apt.status)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{apt.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {apt.clientPhone}
                                  </span>
                                </div>
                                <div 
                                  className="text-sm font-medium"
                                  style={{ color: serviceColor }}
                                >
                                  {apt.serviceName}
                                </div>
                                {apt.duration && (
                                  <div className="text-xs text-muted-foreground">
                                    Duração: {apt.duration}{" "}
                                    {apt.durationUnit === "hour" ? "hora(s)" : "minuto(s)"}
                                  </div>
                                )}
                                {apt.clientNotes && (
                                  <div className="flex items-start gap-2 mt-2 pt-2 border-t">
                                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <span className="text-sm text-muted-foreground">
                                      {apt.clientNotes}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{dayAppointments.length}</div>
                <div className="text-sm text-muted-foreground">Agendamentos</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendentes</span>
                  <Badge className="bg-yellow-500">
                    {dayAppointments.filter((a) => a.status === "pending").length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confirmados</span>
                  <Badge className="bg-green-500">
                    {dayAppointments.filter((a) => a.status === "confirmed").length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Concluídos</span>
                  <Badge className="bg-blue-500">
                    {dayAppointments.filter((a) => a.status === "completed").length}
                  </Badge>
                </div>
              </div>
              {dayAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum agendamento para este dia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AppointmentDetailsSheet
        appointment={selectedAppointment}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        serviceColor={selectedAppointment ? getServiceColor(selectedAppointment.serviceId) : "#F4A69F"}
      />
    </div>
  );
};

