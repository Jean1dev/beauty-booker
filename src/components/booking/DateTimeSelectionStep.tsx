import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden animate-slide-up">
      <div className="px-6 py-5 border-b border-border">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
          Passo 2 · {selectedService.name}
        </p>
        <h2 className="font-display text-2xl font-normal text-foreground">
          Escolha Data e Horário
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione a data e o horário de sua preferência
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Date selection */}
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Data disponível
          </p>
          {availableDates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6 border border-dashed border-border rounded-xl">
              Nenhuma data disponível no momento
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableDates.map((d) => (
                <button
                  key={d.date}
                  onClick={() => onDateSelect(d.date)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 ${
                    selectedDate === d.date
                      ? "bg-primary text-primary-foreground border-primary shadow-accent"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-secondary/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time selection */}
        {selectedDate && availableTimesForDate.length > 0 && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Horário disponível
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {availableTimesForDate.map((time) => (
                <button
                  key={time}
                  onClick={() => onTimeSelect(selectedDate, time)}
                  className={`py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 ${
                    selectedTime === time
                      ? "bg-primary text-primary-foreground border-primary shadow-accent"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-secondary/50"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && availableTimesForDate.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhum horário disponível para esta data
          </p>
        )}

        <Button
          variant="outline"
          onClick={onBack}
          className="w-full border-border text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>
    </div>
  );
};
