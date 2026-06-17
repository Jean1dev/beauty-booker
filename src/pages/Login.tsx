import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { CalendarCheck, Scissors, Share2, BarChart3, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Scissors,
    title: "Cadastre seus serviços",
    description:
      "Defina o que você oferece, com duração e preço, em poucos minutos.",
  },
  {
    icon: CalendarCheck,
    title: "Configure sua agenda",
    description:
      "Marque seus horários disponíveis, intervalos e os dias em que não atende.",
  },
  {
    icon: Share2,
    title: "Compartilhe seu link",
    description:
      "Envie seu link exclusivo e receba agendamentos a qualquer hora, sem trocar mensagens.",
  },
  {
    icon: BarChart3,
    title: "Acompanhe tudo",
    description:
      "Veja seus agendamentos no calendário e relatórios com o desempenho do seu negócio.",
  },
];

// TODO: substituir pelas URLs reais das lojas quando os apps forem publicados.
const APP_STORE_URL = "#";
const PLAY_STORE_URL = "#";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background animate-fade-in">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-light tracking-tight text-foreground mb-3">
            Beauty<em className="italic text-primary">Book</em>
          </h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Sistema de agendamento · Profissionais da beleza
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-accent">
            <Sparkles className="w-3 h-3" />
            100% gratuito
          </span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[20px] border border-border shadow-medium p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-normal text-foreground">Bem-vindo(a)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O BeautyBook organiza a sua agenda e deixa os seus clientes
              marcarem horário sozinhos, direto pelo seu link — sem ficar
              trocando mensagens para confirmar cada horário.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Crie a sua conta gratuitamente com o Google e comece a receber
              agendamentos hoje mesmo.
            </p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="w-full border-border hover:border-primary/40 hover:bg-secondary/60 text-foreground hover:text-foreground gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isLoading ? "Entrando..." : "Entrar com Google"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos Termos de Serviço
          </p>
        </div>

        {/* Como funciona */}
        <div className="mt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground text-center mb-6">
            Como funciona
          </p>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-secondary text-primary">
                  <step.icon className="w-[18px] h-[18px]" />
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Apps de celular */}
        <div className="mt-10 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Leve no celular
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground mb-5">
            Baixe o app gratuito e gerencie seus agendamentos de onde estiver.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={APP_STORE_URL}
              className="hover-lift flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-foreground px-5 py-2.5 text-background"
            >
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <span className="flex flex-col text-left leading-none">
                <span className="text-[10px] font-normal opacity-80">Baixar na</span>
                <span className="text-sm font-medium">App Store</span>
              </span>
            </a>
            <a
              href={PLAY_STORE_URL}
              className="hover-lift flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-foreground px-5 py-2.5 text-background"
            >
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.25.91-.59 1.19l-2.29 1.32-2.5-2.5 2.5-2.5 2.29 1.3zM6.05 2.66l10.76 6.22-2.27 2.27z" />
              </svg>
              <span className="flex flex-col text-left leading-none">
                <span className="text-[10px] font-normal opacity-80">Disponível no</span>
                <span className="text-sm font-medium">Google Play</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
