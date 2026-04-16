import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useAvailability } from "@/hooks/use-availability";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const ExcludedDays = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { excludedDays, isLoading, updateExcludedDays } = useAvailability({
    userId: userData?.uid || null,
  });

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (excludedDays && excludedDays.length > 0) {
      const today = startOfDay(new Date());
      const dates = excludedDays
        .map((dateStr) => {
          try {
            const date = parseISO(dateStr);
            return isBefore(date, today) ? null : date;
          } catch {
            return null;
          }
        })
        .filter((date): date is Date => date !== null);
      setSelectedDates(dates);
    } else {
      setSelectedDates([]);
    }
  }, [excludedDays]);

  const handleDateSelect = (dates: Date | Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      return;
    }
    const datesArray = Array.isArray(dates) ? dates : [dates];
    const today = startOfDay(new Date());
    const validDates = datesArray.filter((date) => {
      if (isBefore(date, today)) return false;
      return true;
    });
    if (validDates.length !== datesArray.length) {
      toast.error("Não é possível excluir datas passadas");
    }
    setSelectedDates(validDates.sort((a, b) => a.getTime() - b.getTime()));
  };

  const handleRemoveDate = (date: Date) => {
    setSelectedDates((prev) => prev.filter((d) => d.getTime() !== date.getTime()));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const dateStrings = selectedDates.map((date) => format(date, "yyyy-MM-dd"));
      await updateExcludedDays(dateStrings);
      toast.success("Dias excluídos salvos com sucesso!");
    } catch {
      toast.error("Erro ao salvar dias excluídos");
    } finally {
      setIsSaving(false);
    }
  };

  const modifiers = { excluded: selectedDates };
  const modifiersClassNames = {
    excluded: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground",
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="page-title">Dias Excluídos</h1>
            <p className="page-subtitle">Selecione os dias em que você não irá trabalhar</p>
          </div>
        </div>

        {/* Calendar card */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <h2 className="font-medium text-foreground text-sm">Selecionar Dias</h2>
              <p className="text-xs text-muted-foreground">
                Clique nos dias para adicionar ou remover da lista
              </p>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Carregando dias excluídos...
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <CalendarComponent
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleDateSelect}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    locale={ptBR}
                    className="rounded-xl border border-border"
                  />
                </div>

                <div className="md:w-72 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Dias excluídos ({selectedDates.length})
                    </p>
                    {selectedDates.length > 0 && (
                      <button
                        onClick={() => setSelectedDates([])}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Limpar
                      </button>
                    )}
                  </div>

                  {selectedDates.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      Nenhum dia excluído
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {selectedDates.map((date) => (
                        <div
                          key={date.getTime()}
                          className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs font-medium">
                              {format(date, "EEE, d 'de' MMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveDate(date)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          size="lg"
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Salvando..." : "Salvar Dias Excluídos"}
        </Button>
      </div>
    </div>
  );
};

export default ExcludedDays;
