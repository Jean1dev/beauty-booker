import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/services/appointments";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppointmentDetailsSheet } from "./AppointmentDetailsSheet";

interface CalendarMonthlyViewProps {
  appointments: Appointment[];
  serviceColorMap: Map<string, string>;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const CalendarMonthlyView = ({ appointments, serviceColorMap }: CalendarMonthlyViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = apt.dateTime.toDate();
      return isSameDay(aptDate, day) && apt.status !== "cancelled";
    });
  };

  const getServiceColor = (serviceId: string) => {
    return serviceColorMap.get(serviceId) || "#F4A69F";
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold ml-4">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>
        <Button variant="outline" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px border-b">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="bg-muted/50 p-2 text-center text-sm font-semibold"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border">
            {days.map((day, idx) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-[100px] bg-background p-2 border-r border-b",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isToday && "bg-accent/50"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isToday && "text-primary font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const serviceColor = getServiceColor(apt.serviceId);
                      return (
                        <div
                          key={apt.id}
                          className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: serviceColor }}
                          title={`${apt.time} - ${apt.clientName} - ${apt.serviceName}`}
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setIsSheetOpen(true);
                          }}
                        >
                          <div className="text-white font-medium truncate">
                            {apt.time} {apt.clientName}
                          </div>
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-muted-foreground font-medium">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AppointmentDetailsSheet
        appointment={selectedAppointment}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        serviceColor={selectedAppointment ? getServiceColor(selectedAppointment.serviceId) : "#F4A69F"}
      />
    </div>
  );
};

