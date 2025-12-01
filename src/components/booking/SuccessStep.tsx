import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SuccessStepProps {
  selectedService: { name: string } | null;
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  onNewBooking: () => void;
}

export const SuccessStep = ({
  selectedService,
  selectedDate,
  selectedTime,
  clientName,
  onNewBooking,
}: SuccessStepProps) => {
  return (
    <Card className="shadow-medium animate-slide-up">
      <CardContent className="pt-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
        <p className="text-muted-foreground mb-4">
          Seu agendamento foi realizado com sucesso.
        </p>
        <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-left">
          <p className="text-sm text-muted-foreground mb-1">Serviço</p>
          <p className="font-semibold mb-3">{selectedService?.name}</p>
          <p className="text-sm text-muted-foreground mb-1">Data e Horário</p>
          <p className="font-semibold mb-3">
            {selectedDate && selectedTime && format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
          </p>
          <p className="text-sm text-muted-foreground mb-1">Cliente</p>
          <p className="font-semibold">{clientName}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Você receberá uma confirmação em breve.
        </p>
        <Button
          onClick={onNewBooking}
          className="gradient-primary shadow-soft"
        >
          Fazer outro agendamento
        </Button>
      </CardContent>
    </Card>
  );
};

