import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  
  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}min`;
  }
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
    color: "#F4A69F",
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
    const serviceData = {
      ...formData,
      duration: totalMinutes,
      durationUnit: "min" as const,
    };

    try {
      if (editingService) {
        await updateService({
          ...serviceData,
          id: editingService.id,
        });
        trackServiceUpdated(formData.name);
        toast.success("Serviço atualizado com sucesso!");
      } else {
        const newService = await createService(serviceData);
        trackServiceCreated(newService.name);
        toast.success("Serviço criado com sucesso!");
      }
      resetForm();
    } catch (error) {
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
    } catch (error) {
      toast.error("Erro ao excluir serviço");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#F4A69F",
      duration: 30,
      durationUnit: "min",
      advanceDays: 1,
    });
    setDurationHours(0);
    setDurationMinutes(30);
    setEditingService(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                Serviços
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie os serviços que você oferece
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <Card className="shadow-medium">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="w-16 h-16 text-muted-foreground/50 mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando serviços...</p>
            </CardContent>
          </Card>
        ) : services.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum serviço cadastrado</h3>
              <p className="text-muted-foreground mb-6">
                Comece adicionando seu primeiro serviço
              </p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary shadow-soft">
                    <Plus className="w-4 h-4 mr-2" />
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
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="shadow-medium hover-lift group relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: service.color }}
                  />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
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
                    <p className="text-sm text-muted-foreground mb-4">
                      Antecedência: {service.advanceDays}{" "}
                      {service.advanceDays === 1 ? "dia" : "dias"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(service)}
                        className="flex-1 shadow-soft"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        className="shadow-soft text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-strong gradient-primary md:relative md:w-auto md:rounded-lg md:h-auto md:px-6 md:py-3"
                  size="icon"
                >
                  <Plus className="w-6 h-6 md:mr-2" />
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
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Editar Serviço" : "Novo Serviço"}
        </DialogTitle>
        <DialogDescription>
          Preencha as informações do serviço
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Serviço *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
          <p className="text-xs text-muted-foreground">
            {durationHours > 0 || durationMinutes > 0
              ? `Duração total: ${getDurationText(durationHours * 60 + durationMinutes, "min")}`
              : "Defina pelo menos 1 minuto"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="advanceDays">Antecedência (dias) *</Label>
          <Input
            id="advanceDays"
            type="number"
            min="0"
            value={formData.advanceDays}
            onChange={(e) =>
              setFormData({ ...formData, advanceDays: parseInt(e.target.value) })
            }
            required
          />
          <p className="text-xs text-muted-foreground">
            Cliente só poderá agendar com essa antecedência mínima
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 gradient-primary">
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default Services;
