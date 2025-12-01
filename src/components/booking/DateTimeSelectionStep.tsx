import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Service } from "@/services/user-services";

interface DateOption {
  date: string;
  label: string;
  slots: any[];
}

interface DateTimeSelectionStepProps {
  selectedService: Service;
  availableDates: DateOption[];
  selectedDate: string;
  availableTimesForDate: string[];
  selectedTime: string;
  onDateSelect: (date: string) => void;
  onTimeSelect: (date: string, time: string) => void;
  onBack: () => void;
}

export const DateTimeSelectionStep = ({
  selectedService,
  availableDates,
  selectedDate,
  availableTimesForDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  onBack,
}: DateTimeSelectionStepProps) => {
  return (
    <Card className="shadow-medium animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Escolha Data e Horário
        </CardTitle>
        <CardDescription>
          Serviço: {selectedService.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Selecione uma data</Label>
          {availableDates.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma data disponível no momento
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableDates.map((d) => (
                <Button
                  key={d.date}
                  variant={selectedDate === d.date ? "default" : "outline"}
                  onClick={() => onDateSelect(d.date)}
                  className={selectedDate === d.date ? "gradient-primary" : ""}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {selectedDate && availableTimesForDate.length > 0 && (
          <div className="space-y-3 animate-slide-up">
            <Label className="text-sm font-semibold">Selecione um horário</Label>
            <div className="grid grid-cols-4 gap-2">
              {availableTimesForDate.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => onTimeSelect(selectedDate, time)}
                  className={
                    selectedTime === time
                      ? "gradient-primary"
                      : "hover:gradient-primary hover:text-primary-foreground transition-all"
                  }
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && availableTimesForDate.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            Nenhum horário disponível para esta data
          </div>
        )}

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          Voltar
        </Button>
      </CardContent>
    </Card>
  );
};

