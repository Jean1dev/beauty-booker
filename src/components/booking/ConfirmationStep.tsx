import { User, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="shadow-medium animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Confirme seus Dados
        </CardTitle>
        <CardDescription>
          {selectedService?.name} • {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              <User className="w-4 h-4 inline mr-1" />
              Nome Completo *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefone *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormChange("phone", e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onFormChange("notes", e.target.value)}
              placeholder="Alguma observação importante?"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isSubmitting}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary shadow-soft"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

