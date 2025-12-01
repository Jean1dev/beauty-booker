import { useState, useEffect } from "react";
import {
  getUserServices,
  createUserService,
  updateUserService,
  deleteUserService,
  Service,
} from "@/services/user-services";

interface UseUserServicesProps {
  userId: string | null;
}

export const useUserServices = ({ userId }: UseUserServicesProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const firestoreServices = await getUserServices(userId);
        setServices(firestoreServices);
        localStorage.setItem("services", JSON.stringify(firestoreServices));
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error("Erro ao carregar serviços");
        setError(error);
        
        const localServices = localStorage.getItem("services");
        if (localServices) {
          try {
            const parsed = JSON.parse(localServices) as Service[];
            setServices(parsed);
          } catch {
            setServices([]);
          }
        } else {
          setServices([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [userId]);

  const createService = async (service: Omit<Service, "id">): Promise<Service> => {
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    try {
      const serviceId = await createUserService(userId, service);
      const newService: Service = {
        id: serviceId,
        ...service,
      };
      
      const updatedServices = [...services, newService];
      setServices(updatedServices);
      localStorage.setItem("services", JSON.stringify(updatedServices));
      
      return newService;
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      throw error;
    }
  };

  const updateService = async (service: Service): Promise<void> => {
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    try {
      await updateUserService(userId, service);
      
      const updatedServices = services.map((s) =>
        s.id === service.id ? service : s
      );
      setServices(updatedServices);
      localStorage.setItem("services", JSON.stringify(updatedServices));
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      throw error;
    }
  };

  const removeService = async (serviceId: string): Promise<void> => {
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    try {
      await deleteUserService(userId, serviceId);
      
      const updatedServices = services.filter((s) => s.id !== serviceId);
      setServices(updatedServices);
      localStorage.setItem("services", JSON.stringify(updatedServices));
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      throw error;
    }
  };

  return {
    services,
    isLoading,
    error,
    createService,
    updateService,
    removeService,
  };
};

