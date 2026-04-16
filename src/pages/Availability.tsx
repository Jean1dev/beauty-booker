import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  } = useAvailability({ userId: userData?.uid || null });

  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(schedule);
  const [localHolidays, setLocalHolidays] = useState<HolidayConfig[]>(holidays);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);

  useEffect(() => {
    if (schedule.length > 0) setLocalSchedule(schedule);
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
      if (holidaysEnabled) await updateHolidays(localHolidays, holidaysEnabled, holidaysCountry);
      trackAvailabilitySaved();
      toast.success("Disponibilidade salva com sucesso!");
    } catch {
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
          const holidayConfigs: HolidayConfig[] = apiHolidays.map((h) => ({
            date: h.date,
            name: h.name,
            enabled: true,
          }));
          setLocalHolidays(holidayConfigs);
          await updateHolidays(holidayConfigs, enabled, holidaysCountry);
        } catch {
          toast.error("Erro ao carregar feriados");
        } finally {
          setIsLoadingHolidays(false);
        }
      } else {
        await updateHolidays(localHolidays, enabled, holidaysCountry);
      }
      setHolidaysEnabled(enabled);
    } catch {
      toast.error("Erro ao atualizar configuração de feriados");
    }
  };

  const getNextOccurrence = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "d MMM yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
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
            <h1 className="page-title">Disponibilidade</h1>
            <p className="page-subtitle">Configure seus horários de trabalho</p>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <h2 className="font-medium text-foreground text-sm">Horários da Semana</h2>
              <p className="text-xs text-muted-foreground">Defina quando você está disponível para atendimentos</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Carregando disponibilidade...
              </div>
            ) : (
              localSchedule.map((day, index) => (
                <div
                  key={day.day}
                  className={`p-4 rounded-xl border transition-all ${
                    day.enabled
                      ? "bg-primary/5 border-primary/20"
                      : "bg-secondary/50 border-border"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-3 md:w-44">
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={() => handleToggleDay(index)}
                      />
                      <Label className="text-sm font-medium cursor-pointer">{day.day}</Label>
                    </div>

                    {day.enabled && (
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                            Início
                          </Label>
                          <Input
                            type="time"
                            value={day.start}
                            onChange={(e) => handleTimeChange(index, "start", e.target.value)}
                            className="w-full rounded-xl border-border bg-card text-sm"
                          />
                        </div>
                        <span className="text-muted-foreground text-sm pt-5">→</span>
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
                            Fim
                          </Label>
                          <Input
                            type="time"
                            value={day.end}
                            onChange={(e) => handleTimeChange(index, "end", e.target.value)}
                            className="w-full rounded-xl border-border bg-card text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {!day.enabled && (
                      <span className="text-xs text-muted-foreground italic">Indisponível</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Holidays */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <h2 className="font-medium text-foreground text-sm">Feriados</h2>
              <p className="text-xs text-muted-foreground">
                O sistema marcará você como indisponível nos feriados selecionados
              </p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">País</Label>
                <Select
                  value={holidaysCountry}
                  onValueChange={(value) => setHolidaysCountry(value)}
                  disabled={!holidaysEnabled}
                >
                  <SelectTrigger className="w-36 rounded-xl border-border text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={holidaysEnabled} onCheckedChange={handleToggleHolidaysEnabled} />
                <Label className="text-sm font-medium cursor-pointer">Ativar feriados</Label>
              </div>
            </div>

            {isLoadingHolidays ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Carregando feriados...
              </div>
            ) : holidaysEnabled && localHolidays.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {localHolidays.map((holiday, index) => (
                  <div
                    key={`${holiday.date}-${index}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getNextOccurrence(holiday.date)}
                      </p>
                    </div>
                    <Switch
                      checked={holiday.enabled}
                      onCheckedChange={() => handleToggleHoliday(index)}
                    />
                  </div>
                ))}
              </div>
            ) : holidaysEnabled ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum feriado encontrado
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Ative os feriados para começar
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading || isLoadingHolidays}
          size="lg"
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || isLoadingHolidays ? "Salvando..." : "Salvar Disponibilidade"}
        </Button>
      </div>
    </div>
  );
};

export default Availability;
