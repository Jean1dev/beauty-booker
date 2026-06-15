import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {AppointmentRepository} from "../services/appointment.repository";

interface AppointmentDoc {
  id: string;
  duration?: number;
  durationUnit?: "min" | "hour";
  dateTime: admin.firestore.Timestamp;
}

const DEFAULT_DURATION_MINUTES = 30;

function getDurationMinutes(apt: AppointmentDoc): number {
  if (apt.duration && apt.durationUnit) {
    return apt.durationUnit === "hour" ? apt.duration * 60 : apt.duration;
  }
  return DEFAULT_DURATION_MINUTES;
}

export class CompletePastAppointmentsUseCase {
  static async execute(): Promise<void> {
    const now = new Date();
    const nowTs = admin.firestore.Timestamp.fromDate(now);

    const appointments = await AppointmentRepository
      .getActiveAppointmentsStartedBefore(nowTs) as AppointmentDoc[];

    if (appointments.length === 0) {
      logger.info("Nenhum agendamento ativo para concluir");
      return;
    }

    let completedCount = 0;

    for (const apt of appointments) {
      const start = apt.dateTime.toDate();
      const durationMs = getDurationMinutes(apt) * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      if (end.getTime() > now.getTime()) {
        continue;
      }

      try {
        await AppointmentRepository.completeAppointment(apt.id);
        completedCount++;
        logger.info(`Agendamento ${apt.id} marcado como concluído`);
      } catch (error: unknown) {
        logger.error(`Erro ao concluir agendamento ${apt.id}:`, error);
      }
    }

    logger.info(`${completedCount} agendamento(s) concluído(s)`);
  }
}
