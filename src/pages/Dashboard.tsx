import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Palette, Link as LinkIcon, LogOut, Sparkles, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useUserLink } from "@/hooks/use-user-link";
import { trackNavigation } from "@/lib/analytics";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, userData } = useAuth();
  const { bookingLink, isLoading: isLoadingLink, error: linkError } = useUserLink({
    userId: userData?.uid || null,
    email: userData?.email || null,
    displayName: userData?.displayName || null,
  });
  
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
      description: "Gerencie seus serviços oferecidos",
      icon: Sparkles,
      path: "/services",
      gradient: "from-primary to-accent",
    },
    {
      title: "Disponibilidade",
      description: "Configure seus horários de trabalho",
      icon: Clock,
      path: "/availability",
      gradient: "from-accent to-success",
    },
    {
      title: "Agenda",
      description: "Visualize seus agendamentos",
      icon: Calendar,
      path: "/appointments",
      gradient: "from-success to-primary",
    },
    {
      title: "Personalização",
      description: "Personalize cores, logo e aparência",
      icon: Palette,
      path: "/theme",
      gradient: "from-primary via-accent to-success",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo(a) de volta! Gerencie seu negócio aqui.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="shadow-soft hover-lift"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Quick Action - Booking Link */}
        <Card className="shadow-medium border-primary/20 hover-lift">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Link de Agendamento
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Compartilhe este link com seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {linkError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <p className="font-semibold mb-1">Erro ao carregar link</p>
                <p>Verifique as configurações do Firestore. Consulte o arquivo FIRESTORE_SETUP.md para mais informações.</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={bookingLink || (isLoadingLink ? "Carregando..." : linkError ? "Erro ao carregar" : "")}
                  className="w-full px-4 py-2 bg-secondary rounded-lg border border-border text-sm pr-10"
                />
                {bookingLink && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyLink}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleOpenPreview}
                disabled={!bookingLink || isLoadingLink}
                className="gradient-accent shadow-soft hover:opacity-90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ver Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="shadow-medium hover-lift cursor-pointer group"
              onClick={() => handleNavigation(item.path, item.title)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-soft group-hover:shadow-medium transition-all`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="text-base">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
