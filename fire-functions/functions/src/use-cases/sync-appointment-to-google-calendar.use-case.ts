import {OAuthService} from "../services/oauth.service";
import {CalendarService} from "../services/calendar.service";
import {IntegrationRepository} from "../services/integration.repository";
import {AppointmentRepository} from "../services/appointment.repository";
import {AppointmentData} from "../types/google-calendar.types";
import * as logger from "firebase-functions/logger";

export class SyncAppointmentToGoogleCalendarUseCase {
  static async execute(
    userId: string,
    appointmentId: string,
    appointment: AppointmentData
  ): Promise<void> {
    const hasIntegration = await IntegrationRepository.exists(userId);
    if (!hasIntegration) {
      logger.info("Usuário não tem Google Calendar conectado, pulando sincronização");
      return;
    }

    try {
      const client = await OAuthService.getAuthenticatedClient(userId);

      const startDateTime = appointment.dateTime.toDate();
      const duration = appointment.duration || 30;
      const durationUnit = appointment.durationUnit || "min";
      const durationMinutes = durationUnit === "hour" ? duration * 60 : duration;
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      const summary = `${appointment.serviceName} - ${appointment.clientName}`;
      const description = [
        `Cliente: ${appointment.clientName}`,
        `Telefone: ${appointment.clientPhone}`,
        appointment.clientNotes ? `Observações: ${appointment.clientNotes}` : "",
      ].filter(Boolean).join("\n");

      const eventData = {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        summary,
        description,
      };

      const response = await CalendarService.createEvent(client, eventData);

      await AppointmentRepository.updateGoogleCalendarEventId(
        appointmentId,
        response.eventId
      );

      logger.info(`Evento criado no Google Calendar: ${response.eventId}`);
    } catch (error: unknown) {
      logger.error("Erro ao sincronizar agendamento com Google Calendar:", error);
      throw error;
    }
  }
}

