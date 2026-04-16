import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trackServiceCreated, trackServiceUpdated, trackServiceDeleted } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { useUserServices } from "@/hooks/use-user-services";
import { Service } from "@/services/user-services";

const getDurationText = (duration: number, unit: "min" | "hour") => {
  const totalMinutes = unit === "hour" ? duration * 60 : duration;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
};

const Services = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { services, isLoading, createService, updateService, removeService } = useUserServices({
    userId: userData?.uid || null,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#C45C58",
    duration: 30,
    durationUnit: "min" as "min" | "hour",
    advanceDays: 1,
  });
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do serviço é obrigatório");
      return;
    }

    if (durationHours === 0 && durationMinutes === 0) {
      toast.error("A duração deve ser maior que zero");
      return;
    }

    const totalMinutes = durationHours * 60 + durationMinutes;
    const serviceData = { ...formData, duration: totalMinutes, durationUnit: "min" as const };

    try {
      if (editingService) {
        await updateService({ ...serviceData, id: editingService.id });
        trackServiceUpdated(formData.name);
        toast.success("Serviço atualizado com sucesso!");
      } else {
        const newService = await createService(serviceData);
        trackServiceCreated(newService.name);
        toast.success("Serviço criado com sucesso!");
      }
      resetForm();
    } catch {
      toast.error("Erro ao salvar serviço");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData(service);
    const totalMinutes = service.durationUnit === "hour" ? service.duration * 60 : service.duration;
    setDurationHours(Math.floor(totalMinutes / 60));
    setDurationMinutes(totalMinutes % 60);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const service = services.find((s) => s.id === id);
    if (!service) return;
    try {
      await removeService(id);
      trackServiceDeleted(service.name);
      toast.success("Serviço excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir serviço");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", color: "#C45C58", duration: 30, durationUnit: "min", advanceDays: 1 });
    setDurationHours(0);
    setDurationMinutes(30);
    setEditingService(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

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
            <h1 className="page-title">Serviços</h1>
            <p className="page-subtitle">Gerencie os serviços que você oferece</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="bg-card rounded-[20px] border border-border p-16 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-muted-foreground">Carregando serviços...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-card rounded-[20px] border border-border p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-normal mb-2">Nenhum serviço cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Comece adicionando seu primeiro serviço
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mx-auto">
                  <Plus className="w-4 h-4" />
                  Adicionar Serviço
                </Button>
              </DialogTrigger>
              <ServiceDialog
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                isEditing={!!editingService}
                durationHours={durationHours}
                setDurationHours={setDurationHours}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
              />
            </Dialog>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-card border border-border rounded-[20px] overflow-hidden hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="h-1" style={{ backgroundColor: service.color }} />
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                      <h3 className="font-medium text-foreground text-sm">{service.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Duração: {getDurationText(service.duration, service.durationUnit)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Antecedência: {service.advanceDays}{" "}
                      {service.advanceDays === 1 ? "dia" : "dias"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                        className="flex-1 border-border text-muted-foreground hover:text-foreground text-xs"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        className="border-border text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-accent md:relative md:w-auto md:rounded-full md:h-10 md:px-6">
                  <Plus className="w-5 h-5 md:mr-0" />
                  <span className="hidden md:inline">Adicionar Serviço</span>
                </Button>
              </DialogTrigger>
              <ServiceDialog
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                isEditing={!!editingService}
                durationHours={durationHours}
                setDurationHours={setDurationHours}
                durationMinutes={durationMinutes}
                setDurationMinutes={setDurationMinutes}
              />
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};

const ServiceDialog = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEditing,
  durationHours,
  setDurationHours,
  durationMinutes,
  setDurationMinutes,
}: {
  formData: any;
  setFormData: any;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  durationHours: number;
  setDurationHours: (value: number) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
}) => {
  return (
    <DialogContent className="sm:max-w-md rounded-[20px]">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl font-normal">
          {isEditing ? "Editar Serviço" : "Novo Serviço"}
        </DialogTitle>
        <DialogDescription>Preencha as informações do serviço</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            Nome do Serviço *
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Manicure, Piercing, Tattoo"
            required
            className="rounded-xl border-border bg-secondary/50 focus:bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            Cor
          </Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-16 h-10 cursor-pointer rounded-xl p-1 border-border"
            />
            <Input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 rounded-xl border-border bg-secondary/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            Duração *
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Horas</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                className="rounded-xl border-border bg-secondary/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Minutos</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="rounded-xl border-border bg-secondary/50"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {durationHours > 0 || durationMinutes > 0
              ? `Total: ${durationHours > 0 ? `${durationHours}h ` : ""}${durationMinutes > 0 ? `${durationMinutes}min` : ""}`
              : "Defina pelo menos 1 minuto"}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium">
            Antecedência (dias) *
          </Label>
          <Input
            type="number"
            min="0"
            value={formData.advanceDays}
            onChange={(e) => setFormData({ ...formData, advanceDays: parseInt(e.target.value) })}
            required
            className="rounded-xl border-border bg-secondary/50"
          />
          <p className="text-xs text-muted-foreground">
            Antecedência mínima para agendamento
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default Services;
