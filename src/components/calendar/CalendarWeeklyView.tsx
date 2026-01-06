import { useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/services/appointments";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppointmentDetailsSheet } from "./AppointmentDetailsSheet";

interface CalendarWeeklyViewProps {
  appointments: Appointment[];
  serviceColorMap: Map<string, string>;
  onAppointmentCancelled?: () => void;
}

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const VISIBLE_HOURS = ALL_HOURS.filter((hour) => hour >= 7);

export const CalendarWeeklyView = ({ appointments, serviceColorMap, onAppointmentCancelled }: CalendarWeeklyViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getAppointmentsForDayAndHour = (day: Date, hour: number) => {
    return appointments.filter((apt) => {
      const aptDate = apt.dateTime.toDate();
      const aptHour = aptDate.getHours();
      return (
        isSameDay(aptDate, day) &&
        aptHour === hour &&
        apt.status !== "cancelled"
      );
    });
  };

  const getServiceColor = (serviceId: string) => {
    return serviceColorMap.get(serviceId) || "#F4A69F";
  };

  const previousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold ml-4">
            {format(weekStart, "d", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>
        <Button variant="outline" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 border-r bg-muted/50 font-semibold text-sm">
                  Hora
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 text-center border-r bg-muted/50",
                      isSameDay(day, new Date()) && "bg-accent/50"
                    )}
                  >
                    <div className="text-xs font-semibold">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className="text-lg font-bold">
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-8">
                {VISIBLE_HOURS.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="p-2 border-r border-b text-sm text-muted-foreground text-right pr-4 bg-muted/20">
                      {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                    </div>
                    {weekDays.map((day) => {
                      const dayAppointments = getAppointmentsForDayAndHour(day, hour);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className={cn(
                            "min-h-[60px] border-r border-b p-1",
                            isToday && "bg-accent/20"
                          )}
                        >
                          {dayAppointments.map((apt) => {
                            const serviceColor = getServiceColor(apt.serviceId);
                            return (
                              <div
                                key={apt.id}
                                className="text-xs p-1 rounded border mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ 
                                  backgroundColor: serviceColor,
                                  borderColor: serviceColor
                                }}
                                title={`${apt.time} - ${apt.clientName} - ${apt.serviceName}`}
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setIsSheetOpen(true);
                                }}
                              >
                                <div className="text-white font-medium truncate">
                                  {apt.time}
                                </div>
                                <div className="text-white/90 truncate text-[10px]">
                                  {apt.clientName}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AppointmentDetailsSheet
        appointment={selectedAppointment}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        serviceColor={selectedAppointment ? getServiceColor(selectedAppointment.serviceId) : "#F4A69F"}
        onAppointmentCancelled={onAppointmentCancelled}
      />
    </div>
  );
};

