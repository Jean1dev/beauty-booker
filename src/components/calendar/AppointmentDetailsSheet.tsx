import { useState, useEffect } from "react";
import { Appointment, cancelAppointment, updateAppointmentStatus } from "@/services/appointments";
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
import { Clock, User, Phone, FileText, Calendar, Sparkles, X, Check, UserX } from "lucide-react";
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSafariMobile, setIsSafariMobile] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setIsSafariMobile(false);
      return;
    }
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
    setIsSafariMobile(!!(isIOS && isSafari));
  }, []);

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

  const handleStatusChange = async (status: Appointment["status"], successMessage: string) => {
    if (!appointment.id) return;

    try {
      setIsUpdatingStatus(true);
      await updateAppointmentStatus(appointment.id, status);
      toast({
        title: successMessage,
        description: "O status do agendamento foi atualizado.",
      });
      onOpenChange(false);
      if (onAppointmentCancelled) {
        onAppointmentCancelled();
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isTerminalStatus =
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "no_show";
  const canCancel = !isTerminalStatus;
  const isPast = appointmentDate.getTime() < Date.now();
  // Baixa de comparecimento só faz sentido depois do horário e antes de um status terminal
  const canMarkAttendance = isPast && !isTerminalStatus;

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
      case "no_show":
        return <Badge className="bg-orange-500">Não compareceu</Badge>;
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
      <SheetContent className="sm:max-w-md flex flex-col max-h-[100dvh] sm:max-h-none p-0">
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 pr-12"
          style={{
            paddingTop: `max(env(safe-area-inset-top), ${isSafariMobile ? "3.5rem" : "1.5rem"})`,
          }}
        >
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

          {canMarkAttendance && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Registrar comparecimento</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full border-blue-500/40 text-blue-600 hover:bg-blue-500/5 hover:text-blue-700"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("completed", "Atendimento concluído")}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Compareceu
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-orange-500/40 text-orange-600 hover:bg-orange-500/5 hover:text-orange-700"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange("no_show", "Falta registrada")}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Não compareceu
                  </Button>
                </div>
              </div>
            </>
          )}

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
        </div>
      </SheetContent>
    </Sheet>
  );
};

