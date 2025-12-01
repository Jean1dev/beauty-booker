import { useState, useEffect } from "react";
import { Calendar, Clock, User, Phone, MessageSquare, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  color: string;
  duration: number;
  durationUnit: "min" | "hour";
}

const BookingPublic = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    const savedServices = localStorage.getItem("services");
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    }
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    toast.success("Agendamento confirmado! Em breve você receberá a confirmação.");
    
    // Reset form
    setTimeout(() => {
      setStep(1);
      setSelectedService(null);
      setSelectedDate("");
      setSelectedTime("");
      setFormData({ name: "", phone: "", notes: "" });
    }, 2000);
  };

  const getDurationText = (duration: number, unit: "min" | "hour") => {
    return unit === "min" ? `${duration} min` : `${duration}h`;
  };

  // Mock available times
  const availableTimes = [
    "08:00", "09:00", "10:00", "11:00", 
    "14:00", "15:00", "16:00", "17:00"
  ];

  const availableDates = [
    { date: "2025-12-15", label: "Seg, 15 Dez" },
    { date: "2025-12-16", label: "Ter, 16 Dez" },
    { date: "2025-12-17", label: "Qua, 17 Dez" },
    { date: "2025-12-18", label: "Qui, 18 Dez" },
    { date: "2025-12-19", label: "Sex, 19 Dez" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary shadow-medium mb-2">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Agende seu Horário
          </h1>
          <p className="text-muted-foreground">
            Escolha o serviço e o melhor horário para você
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? "gradient-primary text-primary-foreground shadow-soft"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <ChevronRight className={step > s ? "text-primary" : "text-muted-foreground"} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Service */}
        {step === 1 && (
          <Card className="shadow-medium animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Escolha um Serviço
              </CardTitle>
              <CardDescription>
                Selecione o serviço que deseja agendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum serviço disponível no momento
                </p>
              ) : (
                services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full p-4 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-secondary/50 transition-all text-left shadow-soft hover:shadow-medium group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Duração: {getDurationText(service.duration, service.durationUnit)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Date & Time */}
        {step === 2 && selectedService && (
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
              {/* Dates */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Selecione uma data</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDates.map((d) => (
                    <Button
                      key={d.date}
                      variant={selectedDate === d.date ? "default" : "outline"}
                      onClick={() => setSelectedDate(d.date)}
                      className={selectedDate === d.date ? "gradient-primary" : ""}
                    >
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Times */}
              {selectedDate && (
                <div className="space-y-3 animate-slide-up">
                  <Label className="text-sm font-semibold">Selecione um horário</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        onClick={() => handleTimeSelect(selectedDate, time)}
                        className="hover:gradient-primary hover:text-primary-foreground transition-all"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full"
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm Details */}
        {step === 3 && (
          <Card className="shadow-medium animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Confirme seus Dados
              </CardTitle>
              <CardDescription>
                {selectedService?.name} • {selectedDate} às {selectedTime}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Alguma observação importante?"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary shadow-soft">
                    Confirmar Agendamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookingPublic;
