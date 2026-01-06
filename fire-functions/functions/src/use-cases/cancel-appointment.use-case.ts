import {OAuthService} from "../services/oauth.service";
import {CalendarService} from "../services/calendar.service";
import {IntegrationRepository} from "../services/integration.repository";
import {AppointmentRepository} from "../services/appointment.repository";
import * as logger from "firebase-functions/logger";

export class CancelAppointmentUseCase {
  static async execute(
    userId: string,
    appointmentId: string
  ): Promise<void> {
    const appointment = await AppointmentRepository.getAppointment(appointmentId);

    if (appointment.userId !== userId) {
      throw new Error("Usuário não autorizado a cancelar este agendamento");
    }

    if (appointment.status === "cancelled") {
      logger.info("Agendamento já está cancelado");
      return;
    }

    await AppointmentRepository.cancelAppointment(appointmentId);

    if (appointment.googleCalendarEventId) {
      const hasIntegration = await IntegrationRepository.exists(userId);
      if (hasIntegration) {
        try {
          const client = await OAuthService.getAuthenticatedClient(userId);
          await CalendarService.cancelEvent(client, appointment.googleCalendarEventId);
          logger.info(`Evento cancelado no Google Calendar: ${appointment.googleCalendarEventId}`);
        } catch (error: unknown) {
          logger.error("Erro ao cancelar evento no Google Calendar:", error);
        }
      }
    }

    logger.info(`Agendamento cancelado: ${appointmentId}`);
  }
}
