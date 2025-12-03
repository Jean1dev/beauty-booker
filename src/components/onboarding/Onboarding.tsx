import { useState } from "react";
import { Sparkles, Clock, Link as LinkIcon, CheckCircle2, ArrowRight, X, Rocket, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUserServices } from "@/hooks/use-user-services";
import { useAvailability } from "@/hooks/use-availability";
import { useUserLink } from "@/hooks/use-user-link";
import { saveUserLink } from "@/services/user-preferences";
import { generateUserId } from "@/lib/user-id";
import { Service } from "@/services/user-services";
import { DaySchedule } from "@/services/availability";
import { toast } from "sonner";

interface OnboardingProps {
  userId: string;
  email: string | null;
  displayName: string | null;
  onComplete: () => void;
}

type OnboardingStep = "intro" | "services" | "availability" | "link";

const Onboarding = ({ userId, email, displayName, onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("intro");
  const [_, setHasSkipped] = useState(false);

  const { services, createService, updateService, removeService } = useUserServices({ userId });
  const { schedule, updateSchedule, isLoading: isLoadingAvailability } = useAvailability({ userId });
  const { bookingLink, isLoading: isLoadingLink } = useUserLink({
    userId,
    email,
    displayName,
  });

  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(schedule);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    color: "#F4A69F",
    duration: 30,
    durationUnit: "min" as "min" | "hour",
    advanceDays: 1,
  });
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);


  const handleSkip = async () => {
    try {
      const generatedLink = generateUserId(userId, email, displayName);
      await saveUserLink(userId, generatedLink);
      setHasSkipped(true);
      toast.success("Onboarding pulado! Você pode configurar tudo depois.");
      onComplete();
    } catch (error) {
      console.error("Erro ao pular onboarding:", error);
      toast.error("Erro ao pular onboarding");
    }
  };

  const handleComplete = async () => {
    try {
      if (!bookingLink) {
        const generatedLink = generateUserId(userId, email, displayName);
        await saveUserLink(userId, generatedLink);
        toast.success("Link de agendamento criado com sucesso!");
      }
      onComplete();
    } catch (error) {
      console.error("Erro ao finalizar onboarding:", error);
      toast.error("Erro ao finalizar onboarding");
    }
  };

  const handleStart = () => {
    setCurrentStep("services");
  };

  const handleNext = () => {
    if (currentStep === "services") {
      setCurrentStep("availability");
    } else if (currentStep === "availability") {
      setCurrentStep("link");
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceFormData.name.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }

    if (durationHours === 0 && durationMinutes === 0) {
      toast.error("A duração deve ser maior que zero");
      return;
    }

    const totalMinutes = durationHours * 60 + durationMinutes;
    const serviceData = {
      ...serviceFormData,
      duration: totalMinutes,
      durationUnit: "min" as const,
    };

    try {
      if (editingService) {
        await updateService({
          ...serviceData,
          id: editingService.id,
        });
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await createService(serviceData);
        toast.success("Serviço criado com sucesso!");
      }
      resetServiceForm();
    } catch (error) {
      toast.error("Erro ao salvar serviço");
    }
  };

  const resetServiceForm = () => {
    setServiceFormData({
      name: "",
      color: "#F4A69F",
      duration: 30,
      durationUnit: "min",
      advanceDays: 1,
    });
    setDurationHours(0);
    setDurationMinutes(30);
    setEditingService(null);
    setIsServiceDialogOpen(false);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceFormData(service);
    const totalMinutes = service.durationUnit === "hour" ? service.duration * 60 : service.duration;
    setDurationHours(Math.floor(totalMinutes / 60));
    setDurationMinutes(totalMinutes % 60);
    setIsServiceDialogOpen(true);
  };

  const handleDeleteService = async (id: string) => {
    try {
      await removeService(id);
      toast.success("Serviço excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir serviço");
    }
  };

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

  const handleSaveAvailability = async () => {
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
      toast.success("Disponibilidade salva com sucesso!");
      handleNext();
    } catch (error) {
      toast.error("Erro ao salvar disponibilidade");
    }
  };

  const getDurationText = (duration: number, unit: "min" | "hour") => {
    const totalMinutes = unit === "hour" ? duration * 60 : duration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };

  const getProgress = () => {
    if (currentStep === "intro") return 0;
    if (currentStep === "services") return 33;
    if (currentStep === "availability") return 66;
    return 100;
  };

  const getStepNumber = () => {
    if (currentStep === "intro") return 0;
    if (currentStep === "services") return 1;
    if (currentStep === "availability") return 2;
    return 3;
  };

  if (currentStep === "intro") {
    return (
      <div className="min-h-screen p-4 md:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Pular onboarding
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-medium">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Bem-vindo ao Beauty Booker!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Vamos configurar seu sistema de agendamentos em poucos passos simples
            </p>
          </div>

          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Por que usar o Beauty Booker?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Agendamentos Automatizados</h3>
                    <p className="text-sm text-muted-foreground">
                      Seus clientes agendam diretamente pelo link, sem necessidade de contato manual
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Gestão Completa</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize todos os agendamentos em uma agenda organizada e intuitiva
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Disponibilidade Inteligente</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure seus horários e o sistema gerencia automaticamente os slots disponíveis
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Personalização Total</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize cores, logo e aparência para combinar com sua marca
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">O que vamos configurar?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Serviços
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione os serviços que você oferece, com duração e cores personalizadas
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Disponibilidade
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure seus horários de trabalho e dias da semana disponíveis
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Seu Link de Agendamento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Receba seu link personalizado e aprenda como compartilhar com seus clientes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="shadow-soft"
            >
              Pular onboarding
            </Button>
            <Button
              onClick={handleStart}
              className="gradient-primary shadow-soft hover-lift"
            >
              Começar configuração
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Configuração Inicial</h2>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Pular
            </Button>
          </div>
          <Progress value={getProgress()} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Etapa {getStepNumber()} de 3
          </p>
        </div>

        {currentStep === "services" && (
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Etapa 1: Criar Serviços</CardTitle>
                  <CardDescription>
                    Adicione os serviços que você oferece aos seus clientes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Configure seus serviços com nome, duração, cor e outros detalhes. Você pode adicionar quantos serviços precisar.
              </p>

              {services.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <Card key={service.id} className="shadow-soft hover-lift group relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 w-full h-1"
                        style={{ backgroundColor: service.color }}
                      />
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: service.color }}
                          />
                          {service.name}
                        </CardTitle>
                        <CardDescription>
                          Duração: {getDurationText(service.duration, service.durationUnit)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            className="flex-1 shadow-soft"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="shadow-soft text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gradient-primary shadow-soft">
                    <Plus className="w-4 h-4 mr-2" />
                    {services.length === 0 ? "Adicionar Primeiro Serviço" : "Adicionar Serviço"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? "Editar Serviço" : "Novo Serviço"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha as informações do serviço
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Serviço *</Label>
                      <Input
                        id="name"
                        value={serviceFormData.name}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                        placeholder="Ex: Manicure, Piercing, Tattoo"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Cor</Label>
                      <div className="flex gap-2">
                        <Input
                          id="color"
                          type="color"
                          value={serviceFormData.color}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, color: e.target.value })}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={serviceFormData.color}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Duração *</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="durationHours" className="text-xs text-muted-foreground">
                            Horas
                          </Label>
                          <Input
                            id="durationHours"
                            type="number"
                            min="0"
                            max="23"
                            value={durationHours}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setDurationHours(Math.max(0, Math.min(23, value)));
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="durationMinutes" className="text-xs text-muted-foreground">
                            Minutos
                          </Label>
                          <Input
                            id="durationMinutes"
                            type="number"
                            min="0"
                            max="59"
                            value={durationMinutes}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setDurationMinutes(Math.max(0, Math.min(59, value)));
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="advanceDays">Antecedência (dias) *</Label>
                      <Input
                        id="advanceDays"
                        type="number"
                        min="0"
                        value={serviceFormData.advanceDays}
                        onChange={(e) =>
                          setServiceFormData({ ...serviceFormData, advanceDays: parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={resetServiceForm} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 gradient-primary">
                        {editingService ? "Salvar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("intro")}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  className="gradient-primary shadow-soft hover-lift flex-1"
                  disabled={services.length === 0}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "availability" && (
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center shadow-soft">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Etapa 2: Configurar Disponibilidade</CardTitle>
                  <CardDescription>
                    Defina seus horários de trabalho e dias disponíveis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Configure os horários em que você está disponível para atender clientes. Você pode definir diferentes horários para cada dia da semana.
              </p>

              <div className="space-y-4">
                {localSchedule.map((day, index) => (
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
                        <Label className="font-medium cursor-pointer">
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
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("services")}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSaveAvailability}
                  className="gradient-primary shadow-soft hover-lift flex-1"
                  disabled={isLoadingAvailability}
                >
                  Salvar e Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "link" && (
          <Card className="shadow-medium border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-soft">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Etapa 3: Seu Link de Agendamento</CardTitle>
                  <CardDescription>
                    Compartilhe este link com seus clientes para receber agendamentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <p className="text-sm font-semibold mb-4 text-muted-foreground">
                  Seu link personalizado:
                </p>
                {isLoadingLink ? (
                  <div className="p-4 bg-secondary rounded-lg animate-pulse">
                    <p className="text-muted-foreground">Carregando link...</p>
                  </div>
                ) : bookingLink ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={bookingLink}
                      className="flex-1 px-4 py-3 bg-background rounded-lg border border-border font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(bookingLink);
                        toast.success("Link copiado!");
                      }}
                      className="flex-shrink-0"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive">Seu Link estará disponível em breve</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Como funciona?</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe o link acima com seus clientes através de WhatsApp, Instagram, email ou qualquer outro canal
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seus clientes acessam o link, escolhem um serviço, selecionam data e horário disponível
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      O agendamento aparece automaticamente na sua agenda e você recebe uma notificação
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("availability")}
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    if (bookingLink) {
                      window.open(bookingLink, "_blank");
                    }
                  }}
                  variant="outline"
                  disabled={!bookingLink}
                >
                  Ver Preview
                </Button>
                <Button
                  onClick={handleComplete}
                  className="gradient-primary shadow-soft hover-lift flex-1"
                >
                  Finalizar
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
