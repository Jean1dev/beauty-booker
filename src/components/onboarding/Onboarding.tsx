import { useState } from "react";
import { Sparkles, Clock, Link as LinkIcon, CheckCircle2, ArrowRight, X, Rocket, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { bookingLink, isLoading: isLoadingLink } = useUserLink({ userId, email, displayName });

  const [localSchedule, setLocalSchedule] = useState<DaySchedule[]>(schedule);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: "",
    color: "#C45C58",
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
      toast.success("Onboarding pulado! Configure tudo depois no painel.");
      onComplete();
    } catch {
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
    } catch {
      toast.error("Erro ao finalizar onboarding");
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name.trim()) { toast.error("Nome do serviço é obrigatório"); return; }
    if (durationHours === 0 && durationMinutes === 0) { toast.error("A duração deve ser maior que zero"); return; }

    const totalMinutes = durationHours * 60 + durationMinutes;
    const serviceData = { ...serviceFormData, duration: totalMinutes, durationUnit: "min" as const };

    try {
      if (editingService) {
        await updateService({ ...serviceData, id: editingService.id });
        toast.success("Serviço atualizado!");
      } else {
        await createService(serviceData);
        toast.success("Serviço criado!");
      }
      resetServiceForm();
    } catch {
      toast.error("Erro ao salvar serviço");
    }
  };

  const resetServiceForm = () => {
    setServiceFormData({ name: "", color: "#C45C58", duration: 30, durationUnit: "min", advanceDays: 1 });
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
    try { await removeService(id); toast.success("Serviço excluído!"); }
    catch { toast.error("Erro ao excluir serviço"); }
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
        if (!day.start || !day.end) { toast.error(`Preencha os horários de ${day.day}`); return; }
        if (day.start >= day.end) { toast.error(`Horário inválido em ${day.day}`); return; }
      }
    }
    try {
      await updateSchedule(localSchedule);
      toast.success("Disponibilidade salva!");
      setCurrentStep("link");
    } catch {
      toast.error("Erro ao salvar disponibilidade");
    }
  };

  const getDurationText = (duration: number, unit: "min" | "hour") => {
    const totalMinutes = unit === "hour" ? duration * 60 : duration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
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
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
          <div className="flex justify-end">
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground text-sm">
              <X className="w-4 h-4" />
              Pular
            </Button>
          </div>

          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-light text-foreground">
              Bem-vindo ao <em className="italic text-primary">Beauty Booker!</em>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Vamos configurar seu sistema de agendamentos em poucos passos simples
            </p>
          </div>

          <div className="bg-card rounded-[20px] border border-border shadow-soft p-6">
            <h2 className="font-display text-xl font-normal mb-4">Por que usar o Beauty Booker?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Agendamentos Automatizados", desc: "Seus clientes agendam pelo link sem contato manual" },
                { title: "Gestão Completa", desc: "Visualize todos os agendamentos numa agenda organizada" },
                { title: "Disponibilidade Inteligente", desc: "Configure horários e o sistema gerencia os slots" },
                { title: "Personalização Total", desc: "Customize cores, logo e aparência para sua marca" },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-0.5">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-[20px] border border-border shadow-soft p-6">
            <h2 className="font-display text-xl font-normal mb-4">O que vamos configurar?</h2>
            <div className="space-y-3">
              {[
                { num: 1, icon: Sparkles, title: "Serviços", desc: "Adicione os serviços com duração e cores" },
                { num: 2, icon: Clock, title: "Disponibilidade", desc: "Configure horários e dias disponíveis" },
                { num: 3, icon: LinkIcon, title: "Link de Agendamento", desc: "Receba seu link personalizado" },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-1.5 mb-0.5">
                      <step.icon className="w-3.5 h-3.5" />
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleSkip} className="border-border text-muted-foreground">
              Pular onboarding
            </Button>
            <Button onClick={() => setCurrentStep("services")}>
              Começar configuração
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Configuração Inicial</p>
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground text-xs h-8">
              <X className="w-3.5 h-3.5" />
              Pular
            </Button>
          </div>
          <Progress value={getProgress()} className="h-1.5" />
          <p className="text-xs text-muted-foreground">Etapa {getStepNumber()} de 3</p>
        </div>

        {/* Step: Services */}
        {currentStep === "services" && (
          <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-normal">Etapa 1: Criar Serviços</h2>
                <p className="text-xs text-muted-foreground">Adicione os serviços que você oferece</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {services.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <div key={service.id} className="bg-secondary/50 rounded-xl border border-border overflow-hidden">
                      <div className="h-1" style={{ backgroundColor: service.color }} />
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: service.color }} />
                          <p className="text-sm font-medium">{service.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {getDurationText(service.duration, service.durationUnit)}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditService(service)} className="flex-1 text-xs border-border">
                            <Pencil className="w-3 h-3" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)} className="text-destructive border-border hover:bg-destructive/10">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40">
                    <Plus className="w-4 h-4" />
                    {services.length === 0 ? "Adicionar Primeiro Serviço" : "Adicionar Serviço"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[20px]">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-normal">
                      {editingService ? "Editar Serviço" : "Novo Serviço"}
                    </DialogTitle>
                    <DialogDescription>Preencha as informações do serviço</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Nome *</Label>
                      <Input
                        value={serviceFormData.name}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                        placeholder="Ex: Manicure, Piercing, Tattoo"
                        required
                        className="rounded-xl border-border bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Cor</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={serviceFormData.color} onChange={(e) => setServiceFormData({ ...serviceFormData, color: e.target.value })} className="w-16 h-10 rounded-xl p-1 border-border cursor-pointer" />
                        <Input type="text" value={serviceFormData.color} onChange={(e) => setServiceFormData({ ...serviceFormData, color: e.target.value })} className="flex-1 rounded-xl border-border bg-secondary/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Duração *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1">Horas</Label>
                          <Input type="number" min="0" max="23" value={durationHours} onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))} className="rounded-xl border-border bg-secondary/50" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1">Minutos</Label>
                          <Input type="number" min="0" max="59" value={durationMinutes} onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="rounded-xl border-border bg-secondary/50" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">Antecedência (dias) *</Label>
                      <Input type="number" min="0" value={serviceFormData.advanceDays} onChange={(e) => setServiceFormData({ ...serviceFormData, advanceDays: parseInt(e.target.value) })} required className="rounded-xl border-border bg-secondary/50" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={resetServiceForm} className="flex-1">Cancelar</Button>
                      <Button type="submit" className="flex-1">{editingService ? "Salvar" : "Criar"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setCurrentStep("intro")} className="border-border">Voltar</Button>
                <Button onClick={() => setCurrentStep("availability")} disabled={services.length === 0} className="flex-1">
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Availability */}
        {currentStep === "availability" && (
          <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-normal">Etapa 2: Configurar Disponibilidade</h2>
                <p className="text-xs text-muted-foreground">Defina seus horários e dias disponíveis</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                {localSchedule.map((day, index) => (
                  <div
                    key={day.day}
                    className={`p-4 rounded-xl border transition-all ${
                      day.enabled ? "bg-primary/5 border-primary/20" : "bg-secondary/50 border-border"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex items-center gap-3 md:w-44">
                        <Switch checked={day.enabled} onCheckedChange={() => handleToggleDay(index)} />
                        <Label className="text-sm font-medium cursor-pointer">{day.day}</Label>
                      </div>
                      {day.enabled && (
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <Label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium mb-1">Início</Label>
                            <Input type="time" value={day.start} onChange={(e) => handleTimeChange(index, "start", e.target.value)} className="rounded-xl border-border bg-card text-sm" />
                          </div>
                          <span className="text-muted-foreground text-sm pt-5">→</span>
                          <div className="flex-1">
                            <Label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground font-medium mb-1">Fim</Label>
                            <Input type="time" value={day.end} onChange={(e) => handleTimeChange(index, "end", e.target.value)} className="rounded-xl border-border bg-card text-sm" />
                          </div>
                        </div>
                      )}
                      {!day.enabled && <span className="text-xs text-muted-foreground italic">Indisponível</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setCurrentStep("services")} className="border-border">Voltar</Button>
                <Button onClick={handleSaveAvailability} disabled={isLoadingAvailability} className="flex-1">
                  Salvar e Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Link */}
        {currentStep === "link" && (
          <div className="bg-card rounded-[20px] border border-border shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-normal">Etapa 3: Seu Link de Agendamento</h2>
                <p className="text-xs text-muted-foreground">Compartilhe com seus clientes para receber agendamentos</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-5 bg-secondary/50 rounded-xl border border-border">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
                  Seu link personalizado
                </p>
                {isLoadingLink ? (
                  <div className="h-10 bg-secondary rounded-xl animate-pulse" />
                ) : bookingLink ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={bookingLink}
                      className="flex-1 px-4 py-2.5 bg-card rounded-xl border border-border font-mono text-xs focus:outline-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { navigator.clipboard.writeText(bookingLink); toast.success("Link copiado!"); }}
                      className="flex-shrink-0 border-border"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive">
                    Seu link estará disponível em breve
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Como funciona?</p>
                <div className="space-y-3">
                  {[
                    "Compartilhe o link com seus clientes via WhatsApp, Instagram ou qualquer canal",
                    "Os clientes acessam, escolhem serviço, data e horário disponível",
                    "O agendamento aparece automaticamente na sua agenda",
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCurrentStep("availability")} className="border-border">Voltar</Button>
                {bookingLink && (
                  <Button variant="outline" onClick={() => window.open(bookingLink, "_blank")} className="border-border text-muted-foreground">
                    Ver Preview
                  </Button>
                )}
                <Button onClick={handleComplete} className="flex-1">
                  Finalizar <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
