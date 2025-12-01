import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUserPreferences, saveUserPreferences } from "@/services/user-preferences";
import { hexToHsl, generateGradient, generateShadow } from "@/lib/color-utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface ThemeColors {
  primary: string;
  accent: string;
}

const DEFAULT_THEME: ThemeColors = {
  primary: "#F4A69F",
  accent: "#F5DDA9",
};

interface ThemeContextType {
  theme: ThemeColors;
  isLoading: boolean;
  updateTheme: (colors: ThemeColors) => Promise<void>;
  applyTheme: (colors: ThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeColors>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const applyThemeToDocument = (colors: ThemeColors) => {
    const root = document.documentElement;
    const primaryHsl = hexToHsl(colors.primary);
    const accentHsl = hexToHsl(colors.accent);

    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--accent", accentHsl);

    const primaryForeground = getContrastColor(colors.primary);
    const accentForeground = getContrastColor(colors.accent);

    root.style.setProperty("--primary-foreground", primaryForeground);
    root.style.setProperty("--accent-foreground", accentForeground);

    const gradient = generateGradient(colors.primary, colors.accent);
    root.style.setProperty("--gradient-primary", gradient);

    const shadowSoft = generateShadow(colors.primary, 0.15);
    const shadowMedium = generateShadow(colors.primary, 0.2);
    const shadowStrong = generateShadow(colors.primary, 0.25);

    root.style.setProperty("--shadow-soft", shadowSoft);
    root.style.setProperty("--shadow-medium", shadowMedium);
    root.style.setProperty("--shadow-strong", shadowStrong);
  };

  const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "20 15% 15%" : "0 0% 100%";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  const loadTheme = async () => {
    try {
      setIsLoading(true);

      const localTheme = localStorage.getItem("customTheme");
      if (localTheme) {
        const parsed = JSON.parse(localTheme) as ThemeColors;
        setTheme(parsed);
        applyThemeToDocument(parsed);
        setIsLoading(false);
        return;
      }

      if (userId) {
        const preferences = await getUserPreferences(userId);
        if (preferences?.theme) {
          const themeColors = preferences.theme as ThemeColors;
          setTheme(themeColors);
          applyThemeToDocument(themeColors);
          localStorage.setItem("customTheme", JSON.stringify(themeColors));
          setIsLoading(false);
          return;
        }
      }

      setTheme(DEFAULT_THEME);
      applyThemeToDocument(DEFAULT_THEME);
    } catch (error) {
      console.error("Erro ao carregar tema:", error);
      setTheme(DEFAULT_THEME);
      applyThemeToDocument(DEFAULT_THEME);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTheme();
  }, [userId]);

  const applyTheme = (colors: ThemeColors) => {
    setTheme(colors);
    applyThemeToDocument(colors);
  };

  const updateTheme = async (colors: ThemeColors) => {
    try {
      setTheme(colors);
      applyThemeToDocument(colors);
      localStorage.setItem("customTheme", JSON.stringify(colors));

      if (userId) {
        await saveUserPreferences({
          userId,
          theme: colors,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar tema:", error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isLoading, updateTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

