import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Palette, Link as LinkIcon, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
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
      title: "Tema",
      description: "Personalize cores e aparência",
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
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                readOnly
                value="https://beautybook.app/book/seu-link"
                className="flex-1 px-4 py-2 bg-secondary rounded-lg border border-border text-sm"
              />
              <Button
                onClick={() => navigate("/book/preview")}
                className="gradient-accent shadow-soft hover:opacity-90 transition-smooth"
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
              onClick={() => navigate(item.path)}
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
