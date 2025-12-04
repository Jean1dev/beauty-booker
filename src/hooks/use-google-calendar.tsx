import {useState, useEffect} from "react";
import {
  getGoogleCalendarAuthUrl,
  checkGoogleCalendarConnection,
  disconnectGoogleCalendar,
} from "@/services/google-calendar";
import {toast} from "sonner";

interface UseGoogleCalendarProps {
  userId: string | null;
}

export const useGoogleCalendar = ({userId}: UseGoogleCalendarProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const connected = await checkGoogleCalendarConnection();
        setIsConnected(connected);
      } catch (error: any) {
        console.error("Erro ao verificar conexão:", error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [userId]);

  const connect = async () => {
    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      setIsConnecting(true);
      const authUrl = await getGoogleCalendarAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("Erro ao obter URL de autorização:", error);
      toast.error(error.message || "Erro ao conectar com Google Calendar");
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!userId) {
      return;
    }

    try {
      await disconnectGoogleCalendar();
      setIsConnected(false);
      toast.success("Desconectado do Google Calendar");
    } catch (error: any) {
      console.error("Erro ao desconectar:", error);
      toast.error(error.message || "Erro ao desconectar do Google Calendar");
    }
  };

  return {
    isConnected,
    isLoading,
    isConnecting,
    connect,
    disconnect,
  };
};

