import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConfirmationStepProps {
  selectedService: { name: string } | null;
  selectedDate: string;
  selectedTime: string;
  formData: {
    name: string;
    phone: string;
    notes: string;
  };
  isSubmitting: boolean;
  onFormChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const ConfirmationStep = ({
  selectedService,
  selectedDate,
  selectedTime,
  formData,
  isSubmitting,
  onFormChange,
  onSubmit,
  onBack,
}: ConfirmationStepProps) => {
  return (
    <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden animate-slide-up">
      <div className="px-6 py-5 border-b border-border">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
          Passo 3
        </p>
        <h2 className="font-display text-2xl font-normal text-foreground">
          Confirme seus Dados
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedService?.name} · {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
        </p>
      </div>

      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Nome Completo *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              placeholder="Seu nome completo"
              required
              className="rounded-xl border-border bg-secondary/50 focus:bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Telefone *
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              required
              className="rounded-xl border-border bg-secondary/50 focus:bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Observações (opcional)
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
              placeholder="Alguma informação importante para o profissional?"
              rows={3}
              className="rounded-xl border-border bg-secondary/50 focus:bg-card resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 border-border text-muted-foreground"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
