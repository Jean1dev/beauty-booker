import {httpsCallable} from "firebase/functions";
import {functions} from "@/lib/firebase";

export const getGoogleCalendarAuthUrl = async (): Promise<string> => {
  const getAuthUrl = httpsCallable(functions, "getGoogleCalendarAuthUrl");
  const result = await getAuthUrl();
  return (result.data as {authUrl: string}).authUrl;
};

export const checkGoogleCalendarConnection = async (): Promise<boolean> => {
  const checkConnection = httpsCallable(functions, "checkGoogleCalendarConnection");
  const result = await checkConnection();
  return (result.data as {connected: boolean}).connected;
};

export const disconnectGoogleCalendar = async (): Promise<void> => {
  const disconnect = httpsCallable(functions, "disconnectGoogleCalendar");
  await disconnect();
};

export const createCalendarEvent = async (data: {
  startDateTime: string;
  endDateTime: string;
  summary: string;
  description?: string;
}): Promise<{eventId: string; htmlLink?: string}> => {
  const createEvent = httpsCallable(functions, "createCalendarEvent");
  const result = await createEvent(data);
  return result.data as {eventId: string; htmlLink?: string};
};

