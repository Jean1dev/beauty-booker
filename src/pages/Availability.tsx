import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trackAvailabilitySaved } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { useAvailability } from "@/hooks/use-availability";
import { DaySchedule, HolidayConfig } from "@/services/availability";
import { getHolidaysForCurrentAndNextYear } from "@/services/holidays";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const Availability = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    schedule,
    holidays,
    holidaysEnabled,
    holidaysCountry,
    isLoading,
    updateSchedule,
    updateHolidays,
    setHolidaysEnabled,
    setHolidaysCountry,
  } = useAvailability({
    userId: userData?.uid || null,
  });
  
  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(schedule);
  const [localHolidays, setLocalHolidays] = useState<HolidayConfig[]>(holidays);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  useEffect(() => {
    if (schedule.length > 0) {
      setLocalSchedule(schedule);
    }
  }, [schedule]);

  useEffect(() => {
    setLocalHolidays(holidays);
  }, [holidays]);

  const handleToggleDay = (index: number) => {
    const updated = [...localSchedule];
    updated[index].enabled = !updated[index].enabled;
    setLocalSchedule(updated);
  };

  const handleTimeChange = (index: number, field: "start" | "end", value: string) => {
    const updated = [...localSchedule];
    updated[index][field] = value;
    setLocalSchedule(updated);
  };

  const handleSave = async () => {
    for (const day of localSchedule) {
      if (day.enabled) {
        if (!day.start || !day.end) {
          toast.error(`Preencha os horários de ${day.day}`);
          return;
        }
        if (day.start >= day.end) {
          toast.error(`Horário inválido em ${day.day}. Fim deve ser maior que início.`);
          return;
        }
      }
    }

    try {
      await updateSchedule(localSchedule);
      if (holidaysEnabled) {
        await updateHolidays(localHolidays, holidaysEnabled, holidaysCountry);
      }
      trackAvailabilitySaved();
      toast.success("Disponibilidade salva com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar disponibilidade");
    }
  };

  const handleToggleHoliday = (index: number) => {
    const updated = [...localHolidays];
    updated[index].enabled = !updated[index].enabled;
    setLocalHolidays(updated);
  };

  const handleToggleHolidaysEnabled = async (enabled: boolean) => {
    try {
      if (enabled && localHolidays.length === 0) {
        setIsLoadingHolidays(true);
        try {
          const apiHolidays = await getHolidaysForCurrentAndNextYear();
          const holidayConfigs: HolidayConfig[] = apiHolidays.map((holiday) => ({
            date: holiday.date,
            name: holiday.name,
            enabled: true,
          }));
          setLocalHolidays(holidayConfigs);
          await updateHolidays(holidayConfigs, enabled, holidaysCountry);
        } catch (error) {
          console.error("Erro ao carregar feriados:", error);
          toast.error("Erro ao carregar feriados");
        } finally {
          setIsLoadingHolidays(false);
        }
      } else {
        await updateHolidays(localHolidays, enabled, holidaysCountry);
      }
      setHolidaysEnabled(enabled);
    } catch (error) {
      console.error("Erro ao atualizar feriados:", error);
      toast.error("Erro ao atualizar configuração de feriados");
    }
  };

  const getNextOccurrence = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const currentYear = now.getFullYear();
      const holidayYear = date.getFullYear();
      
      if (holidayYear >= currentYear) {
        return format(date, "d MMM yyyy", { locale: ptBR });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
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
              Disponibilidade
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure seus horários de trabalho
            </p>
          </div>
        </div>

        {/* Schedule Cards */}
        <Card className="shadow-medium">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horários da Semana
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Defina quando você está disponível para atendimentos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando disponibilidade...
              </div>
            ) : (
              localSchedule.map((day, index) => (
              <div
                key={day.day}
                className={`p-4 rounded-xl border transition-all ${
                  day.enabled
                    ? "bg-secondary/50 border-primary/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 md:w-48">
                    <Switch
                      checked={day.enabled}
                      onCheckedChange={() => handleToggleDay(index)}
                    />
                    <Label className="font-medium cursor-pointer" htmlFor={`day-${index}`}>
                      {day.day}
                    </Label>
                  </div>

                  {day.enabled && (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Início</Label>
                        <Input
                          type="time"
                          value={day.start}
                          onChange={(e) => handleTimeChange(index, "start", e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <span className="text-muted-foreground pt-6">até</span>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Fim</Label>
                        <Input
                          type="time"
                          value={day.end}
                          onChange={(e) => handleTimeChange(index, "end", e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {!day.enabled && (
                    <div className="flex-1 text-muted-foreground italic">
                      Indisponível
                    </div>
                  )}
                </div>
              </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Feriados
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              O sistema marcará você como indisponível nos feriados selecionados
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-4 border-b">
              <div className="flex items-center gap-3 flex-1">
                <Label htmlFor="country-select" className="text-sm font-medium">
                  País para feriados
                </Label>
                <Select
                  value={holidaysCountry}
                  onValueChange={(value) => setHolidaysCountry(value)}
                  disabled={!holidaysEnabled}
                >
                  <SelectTrigger id="country-select" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={holidaysEnabled}
                  onCheckedChange={handleToggleHolidaysEnabled}
                />
                <Label htmlFor="holidays-toggle" className="text-sm font-medium cursor-pointer">
                  Ativar feriados
                </Label>
              </div>
            </div>

            {isLoadingHolidays ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando feriados...
              </div>
            ) : holidaysEnabled && localHolidays.length > 0 ? (
              <div className="space-y-2">
                {localHolidays.map((holiday, index) => (
                  <div
                    key={`${holiday.date}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{holiday.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Próximo: {getNextOccurrence(holiday.date)}
                      </div>
                    </div>
                    <Switch
                      checked={holiday.enabled}
                      onCheckedChange={() => handleToggleHoliday(index)}
                    />
                  </div>
                ))}
              </div>
            ) : holidaysEnabled ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum feriado encontrado
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ative os feriados para começar
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={isLoading || isLoadingHolidays}
          className="w-full gradient-primary shadow-medium hover:opacity-90 transition-smooth h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || isLoadingHolidays ? "Salvando..." : "Salvar Disponibilidade"}
        </Button>
      </div>
    </div>
  );
};

export default Availability;
