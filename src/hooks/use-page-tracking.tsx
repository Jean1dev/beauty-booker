import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

const pageNames: Record<string, string> = {
  "/": "Login",
  "/dashboard": "Dashboard",
  "/services": "Serviços",
  "/availability": "Disponibilidade",
  "/appointments": "Agendamentos",
  "/theme": "Tema",
  "/book/preview": "Preview de Agendamento",
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const pageName = pageNames[location.pathname] || "Página Desconhecida";
    trackPageView(pageName);
  }, [location.pathname]);
};

