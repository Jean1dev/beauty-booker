import "./local-env";
import {setGlobalOptions} from "firebase-functions";
import {onRequest, onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {GetGoogleCalendarAuthUrlUseCase} from
  "./use-cases/get-google-calendar-auth-url.use-case";
import {GoogleCalendarCallbackUseCase} from
  "./use-cases/google-calendar-callback.use-case";
import {CreateCalendarEventUseCase} from
  "./use-cases/create-calendar-event.use-case";
import {CheckGoogleCalendarConnectionUseCase} from
  "./use-cases/check-google-calendar-connection.use-case";
import {DisconnectGoogleCalendarUseCase} from
  "./use-cases/disconnect-google-calendar.use-case";
import {SyncAppointmentToGoogleCalendarUseCase} from
  "./use-cases/sync-appointment-to-google-calendar.use-case";
import {SendAppointmentNotificationUseCase} from
  "./use-cases/send-appointment-notification.use-case";
import {CancelAppointmentUseCase} from
  "./use-cases/cancel-appointment.use-case";
import {
  CreateCalendarEventRequest,
  AppointmentData,
} from "./types/google-calendar.types";

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

export const getGoogleCalendarAuthUrl = onCall(
  {
    secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Usuário não autenticado");
    }

    const uid = request.auth.uid;
    return await GetGoogleCalendarAuthUrlUseCase.execute(uid);
  }
);

export const googleCalendarCallback = onRequest(
  {
    secrets: [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI",
      "APP_URL",
    ],
  },
  async (req, res) => {
    try {
      const {code, state} = req.query;
      const redirectUrl = await GoogleCalendarCallbackUseCase.execute(
          code as string,
          state as string
      );
      res.redirect(redirectUrl);
    } catch (error: unknown) {
      logger.error("Erro no callback:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("/appointments?")) {
        res.redirect(errorMessage);
      } else {
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        res.redirect(
          `${appUrl}/appointments?connected=error&message=${
            encodeURIComponent(errorMessage)
          }`
        );
      }
    }
  }
);

export const createCalendarEvent = onCall(
  {
    secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Usuário não autenticado");
    }

    const uid = request.auth.uid;
    const eventData = request.data as CreateCalendarEventRequest;

    return await CreateCalendarEventUseCase.execute(uid, eventData);
  }
);

export const checkGoogleCalendarConnection = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Usuário não autenticado");
  }

  const uid = request.auth.uid;
  return await CheckGoogleCalendarConnectionUseCase.execute(uid);
});

export const disconnectGoogleCalendar = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Usuário não autenticado");
  }

  const uid = request.auth.uid;
  return await DisconnectGoogleCalendarUseCase.execute(uid);
});

export const syncAppointmentToGoogleCalendar = onDocumentCreated(
  {
    document: "appointments/{appointmentId}",
    secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
  },
  async (event) => {
    const appointmentData = event.data?.data();
    if (!appointmentData) {
      logger.warn("Agendamento sem dados");
      return;
    }

    const userId = appointmentData.userId;
    if (!userId) {
      logger.warn("Agendamento sem userId");
      return;
    }

    const appointmentId = event.params.appointmentId;

    try {
      await SyncAppointmentToGoogleCalendarUseCase.execute(
        userId,
        appointmentId,
        appointmentData as AppointmentData
      );
    } catch (error: unknown) {
      logger.error("Erro ao sincronizar agendamento:", error);
    }

    try {
      await SendAppointmentNotificationUseCase.execute(
        userId,
        appointmentData as AppointmentData
      );
    } catch (error: unknown) {
      logger.error("Erro ao enviar notificação de agendamento:", error);
    }
  }
);

export const cancelAppointment = onCall(
  {
    secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"],
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Usuário não autenticado");
    }

    const uid = request.auth.uid;
    const appointmentId = request.data?.appointmentId as string;

    if (!appointmentId) {
      throw new Error("ID do agendamento é obrigatório");
    }

    await CancelAppointmentUseCase.execute(uid, appointmentId);
    return {success: true};
  }
);
