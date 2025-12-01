import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DaySchedule {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

const Availability = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: "Segunda-feira", enabled: true, start: "08:00", end: "18:00" },
    { day: "Terça-feira", enabled: true, start: "08:00", end: "18:00" },
    { day: "Quarta-feira", enabled: true, start: "08:00", end: "18:00" },
    { day: "Quinta-feira", enabled: true, start: "08:00", end: "18:00" },
    { day: "Sexta-feira", enabled: true, start: "08:00", end: "18:00" },
    { day: "Sábado", enabled: false, start: "09:00", end: "14:00" },
    { day: "Domingo", enabled: false, start: "09:00", end: "14:00" },
  ]);

  useEffect(() => {
    const savedSchedule = localStorage.getItem("availability");
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
  }, []);

  const handleToggleDay = (index: number) => {
    const updated = [...schedule];
    updated[index].enabled = !updated[index].enabled;
    setSchedule(updated);
  };

  const handleTimeChange = (index: number, field: "start" | "end", value: string) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSave = () => {
    // Validate times
    for (const day of schedule) {
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

    localStorage.setItem("availability", JSON.stringify(schedule));
    toast.success("Disponibilidade salva com sucesso!");
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
            {schedule.map((day, index) => (
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
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          className="w-full gradient-primary shadow-medium hover:opacity-90 transition-smooth h-12 text-base"
        >
          Salvar Disponibilidade
        </Button>
      </div>
    </div>
  );
};

export default Availability;
