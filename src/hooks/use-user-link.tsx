import { useState, useEffect } from "react";
import { getUserPreferences, saveUserLink } from "@/services/user-preferences";
import { generateUserId } from "@/lib/user-id";

interface UseUserLinkProps {
  userId: string | null;
  email: string | null;
  displayName: string | null;
}

export const useUserLink = ({ userId, email, displayName }: UseUserLinkProps) => {
  const [userLink, setUserLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrCreateUserLink = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const preferences = await getUserPreferences(userId);

        if (preferences?.userLink) {
          setUserLink(preferences.userLink);
        } else {
          const generatedLink = generateUserId(userId, email, displayName);
          await saveUserLink(userId, generatedLink);
          setUserLink(generatedLink);
        }
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error("Erro ao buscar/criar link do usuário");
        setError(error);
        
        if (err?.code === "permission-denied" || err?.message?.includes("permissions")) {
          console.error("Erro de permissão no Firestore. Verifique as regras de segurança:", err);
        } else {
          console.error("Erro ao buscar/criar link do usuário:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateUserLink();
  }, [userId, email, displayName]);

  const bookingLink = userLink ? `https://bookpro.me/book/${userLink}` : null;

  return {
    userLink,
    bookingLink,
    isLoading,
    error,
  };
};

