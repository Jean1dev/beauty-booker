import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Appointments = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-6">
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
              Agenda
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize seus agendamentos
            </p>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader className="gradient-primary text-primary-foreground rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendário de Agendamentos
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Seus compromissos da semana
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-12 pb-16">
            <div className="text-center text-muted-foreground space-y-4">
              <Calendar className="w-16 h-16 mx-auto opacity-50" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Calendário em Desenvolvimento
                </h3>
                <p className="text-sm max-w-md mx-auto">
                  Esta funcionalidade está sendo preparada para você gerenciar
                  todos os seus agendamentos de forma visual e intuitiva.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appointments;
