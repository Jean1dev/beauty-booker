import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Palette, Link as LinkIcon, LogOut, Sparkles, Copy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUserLink } from "@/hooks/use-user-link";
import { trackNavigation } from "@/lib/analytics";
import { toast } from "sonner";
import Onboarding from "@/components/onboarding/Onboarding";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, userData } = useAuth();
  const { bookingLink, isLoading: isLoadingLink, error: linkError } = useUserLink({
    userId: userData?.uid || null,
    email: userData?.email || null,
    displayName: userData?.displayName || null,
  });

  const firstName = userData?.displayName?.split(" ")[0] || "você";

  if (isLoadingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!bookingLink && userData?.uid) {
    return (
      <Onboarding
        userId={userData.uid}
        email={userData.email || null}
        displayName={userData.displayName || null}
        onComplete={() => window.location.reload()}
      />
    );
  }

  const handleCopyLink = () => {
    if (bookingLink) {
      navigator.clipboard.writeText(bookingLink);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handleOpenPreview = () => {
    if (bookingLink) {
      window.open(bookingLink, "_blank");
    } else {
      toast.error("Link ainda não está disponível");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleNavigation = (path: string, title: string) => {
    trackNavigation("Dashboard", title);
    navigate(path);
  };

  const menuItems = [
    {
      title: "Serviços",
      description: "Gerencie os serviços que você oferece",
      icon: Sparkles,
      path: "/services",
    },
    {
      title: "Disponibilidade",
      description: "Configure seus horários de trabalho",
      icon: Clock,
      path: "/availability",
    },
    {
      title: "Dias Excluídos",
      description: "Gerencie dias específicos fora de operação",
      icon: XCircle,
      path: "/availability/excluded-days",
    },
    {
      title: "Agenda",
      description: "Visualize e gerencie seus agendamentos",
      icon: Calendar,
      path: "/appointments",
    },
    {
      title: "Personalização",
      description: "Customize cores, logo e aparência",
      icon: Palette,
      path: "/theme",
    },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
              Painel de controle
            </p>
            <h1 className="font-display text-4xl font-light text-foreground">
              Olá, <em className="italic text-primary">{firstName}</em>
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="mt-1 border-border text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Booking Link Card */}
        <div className="bg-card rounded-[20px] border border-border shadow-soft p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1">
            Seu link de agendamento
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Compartilhe com seus clientes para receber agendamentos
          </p>

          {linkError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              <p className="font-medium mb-1">Erro ao carregar link</p>
              <p className="text-xs">Verifique as configurações do Firestore.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                readOnly
                value={bookingLink || (isLoadingLink ? "Carregando..." : linkError ? "Erro ao carregar" : "")}
                className="w-full px-4 py-2.5 bg-secondary rounded-xl border border-border text-sm text-foreground pr-10 focus:outline-none"
              />
              {bookingLink && (
                <button
                  onClick={handleCopyLink}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full hover:bg-secondary-foreground/10 text-muted-foreground hover:text-primary transition-colors"
                  title="Copiar link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleOpenPreview}
              disabled={!bookingLink || isLoadingLink}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary disabled:opacity-50"
            >
              <LinkIcon className="w-4 h-4" />
              Abrir preview
            </Button>
          </div>
        </div>

        {/* Menu Grid */}
        <div>
          <p className="section-label">Configurações</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path, item.title)}
                className="bg-card border border-border rounded-[20px] p-6 text-left hover:shadow-medium hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
