import { logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { analytics } from "./firebase";

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== "undefined" && analytics) {
    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.error("Erro ao registrar evento do Analytics:", error);
    }
  }
};

export const trackPageView = (pageName: string) => {
  trackEvent("page_view", {
    page_title: pageName,
    page_location: window.location.pathname,
  });
};

export const trackLogin = (method: string) => {
  trackEvent("login", {
    method,
  });
};

export const trackLogout = () => {
  trackEvent("logout");
};

export const trackServiceCreated = (serviceName: string) => {
  trackEvent("service_created", {
    service_name: serviceName,
  });
};

export const trackServiceUpdated = (serviceName: string) => {
  trackEvent("service_updated", {
    service_name: serviceName,
  });
};

export const trackServiceDeleted = (serviceName: string) => {
  trackEvent("service_deleted", {
    service_name: serviceName,
  });
};

export const trackAvailabilitySaved = () => {
  trackEvent("availability_saved");
};

export const trackThemeChanged = (themeType: "preset" | "custom") => {
  trackEvent("theme_changed", {
    theme_type: themeType,
  });
};

export const trackNavigation = (from: string, to: string) => {
  trackEvent("navigation", {
    from_page: from,
    to_page: to,
  });
};

export const setUserAnalytics = (userId: string, userProperties?: Record<string, any>) => {
  if (typeof window !== "undefined" && analytics) {
    try {
      setUserId(analytics, userId);
      if (userProperties) {
        setUserProperties(analytics, userProperties);
      }
    } catch (error) {
      console.error("Erro ao configurar usuário no Analytics:", error);
    }
  }
};

export const clearUserAnalytics = () => {
  if (typeof window !== "undefined" && analytics) {
    try {
      setUserId(analytics, null);
    } catch (error) {
      console.error("Erro ao limpar usuário do Analytics:", error);
    }
  }
};

