import { Button } from "@/components/ui/button";
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
    <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden animate-slide-up">
      <div className="p-8 text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h2 className="font-display text-3xl font-light text-foreground mb-2">
          Agendamento <em className="italic text-primary">Confirmado!</em>
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Seu agendamento foi realizado com sucesso.
        </p>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-xl p-5 mb-6 text-left space-y-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-0.5">Serviço</p>
            <p className="text-sm font-medium text-foreground">{selectedService?.name}</p>
          </div>
          <div className="w-full h-px bg-border" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
              Data e Horário
            </p>
            <p className="text-sm font-medium text-foreground">
              {selectedDate && selectedTime
                ? `${format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })} às ${selectedTime}`
                : "—"}
            </p>
          </div>
          <div className="w-full h-px bg-border" />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-0.5">Cliente</p>
            <p className="text-sm font-medium text-foreground">{clientName}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6">
          Você receberá uma confirmação em breve.
        </p>

        <Button onClick={onNewBooking} variant="outline" className="border-border">
          Fazer outro agendamento
        </Button>
      </div>
    </div>
  );
};
