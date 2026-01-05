import { useState } from "react";
import { Appointment, cancelAppointment } from "@/services/appointments";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Phone, FileText, Calendar, Sparkles, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface AppointmentDetailsSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceColor: string;
  onAppointmentCancelled?: () => void;
}

export const AppointmentDetailsSheet = ({
  appointment,
  open,
  onOpenChange,
  serviceColor,
  onAppointmentCancelled,
}: AppointmentDetailsSheetProps) => {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (!appointment) {
    return (
      <Sheet open={false} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md" />
      </Sheet>
    );
  }

  const appointmentDate = appointment.dateTime.toDate();
  const formattedDate = format(appointmentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(appointmentDate, "HH:mm", { locale: ptBR });

  const handleCancel = async () => {
    if (!appointment.id) return;

    try {
      setIsCancelling(true);
      await cancelAppointment(appointment.id);
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });
      setShowCancelDialog(false);
      onOpenChange(false);
      if (onAppointmentCancelled) {
        onAppointmentCancelled();
      }
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancel = appointment.status !== "cancelled" && appointment.status !== "completed";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Concluído</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDurationText = () => {
    if (!appointment.duration) return "Não especificado";
    
    const totalMinutes = appointment.durationUnit === "hour" 
      ? appointment.duration * 60 
      : appointment.duration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} minuto(s)`;
    } else if (minutes === 0) {
      return `${hours} hora(s)`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: serviceColor }}
            />
            <SheetTitle className="text-2xl">{appointment.serviceName}</SheetTitle>
          </div>
          <SheetDescription className="text-base">
            Detalhes do agendamento
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Cliente</div>
                <div className="font-semibold text-lg">{appointment.clientName}</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Telefone</div>
                <a
                  href={`tel:${appointment.clientPhone}`}
                  className="font-medium text-primary hover:underline"
                >
                  {appointment.clientPhone}
                </a>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Data</div>
                <div className="font-medium capitalize">{formattedDate}</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Horário</div>
                <div className="font-medium">{formattedTime}</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Duração</div>
                <div className="font-medium">{getDurationText()}</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <div
                  className="w-5 h-5 rounded"
                  style={{ backgroundColor: serviceColor }}
                />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <div>{getStatusBadge(appointment.status)}</div>
              </div>
            </div>

            {appointment.clientNotes && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Observações</div>
                    <div className="text-sm whitespace-pre-wrap">{appointment.clientNotes}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {canCancel && (
            <>
              <Separator />
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Agendamento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                      {appointment.googleCalendarEventId && " O evento também será removido do Google Calendar."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>Não</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isCancelling ? "Cancelando..." : "Sim, cancelar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

