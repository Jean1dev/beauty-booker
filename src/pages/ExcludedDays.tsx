import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useAvailability } from "@/hooks/use-availability";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const ExcludedDays = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    excludedDays,
    isLoading,
    updateExcludedDays,
  } = useAvailability({
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
      if (isBefore(date, today)) {
        return false;
      }
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
    } catch (error) {
      toast.error("Erro ao salvar dias excluídos");
    } finally {
      setIsSaving(false);
    }
  };

  const modifiers = {
    excluded: selectedDates,
  };

  const modifiersClassNames = {
    excluded: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground",
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="shadow-soft"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dias Excluídos
            </h1>
            <p className="text-muted-foreground mt-1">
              Selecione os dias em que você não irá trabalhar
            </p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Selecionar Dias
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Clique nos dias do calendário para adicionar ou remover da lista de exclusão
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando dias excluídos...
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <CalendarComponent
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleDateSelect}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </div>

                <div className="md:w-80 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Dias Excluídos ({selectedDates.length})
                    </h3>
                    {selectedDates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum dia excluído
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedDates.map((date) => (
                          <div
                            key={date.getTime()}
                            className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDate(date)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedDates.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDates([])}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Todos
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={isLoading || isSaving}
          className="w-full gradient-primary shadow-medium hover:opacity-90 transition-smooth h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Salvando..." : "Salvar Dias Excluídos"}
        </Button>
      </div>
    </div>
  );
};

export default ExcludedDays;

