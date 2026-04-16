import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {AppointmentRepository} from "../services/appointment.repository";
import {SmsService} from "../services/sms.service";
import {
  formatDateToBrazilian,
  formatPhoneForSms,
} from "../utils/brazil-format";

interface AppointmentDoc {
  id: string;
  userId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  dateTime: admin.firestore.Timestamp;
}

const SAO_PAULO_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

function getTargetDayRangeSaoPaulo(): {start: Date; end: Date} {
  const now = new Date();
  const nowSaoPaulo = new Date(now.getTime() - SAO_PAULO_UTC_OFFSET_MS);
  const y = nowSaoPaulo.getUTCFullYear();
  const m = nowSaoPaulo.getUTCMonth();
  const d = nowSaoPaulo.getUTCDate();
  const targetMidnightUtc = new Date(Date.UTC(y, m, d + 2, 0, 0, 0, 0));
  const targetY = targetMidnightUtc.getUTCFullYear();
  const targetM = targetMidnightUtc.getUTCMonth();
  const targetD = targetMidnightUtc.getUTCDate();
  const start = new Date(Date.UTC(targetY, targetM, targetD, 3, 0, 0, 0));
  const end = new Date(Date.UTC(targetY, targetM, targetD + 1, 2, 59, 59, 999));
  return {start, end};
}

export class SendAppointmentReminderUseCase {
  static async execute(): Promise<void> {
    const {start: startOfTargetDay, end: endOfTargetDay} =
      getTargetDayRangeSaoPaulo();

    const startTs = admin.firestore.Timestamp.fromDate(startOfTargetDay);
    const endTs = admin.firestore.Timestamp.fromDate(endOfTargetDay);

    const appointments = await AppointmentRepository.getAppointmentsBetween(
      startTs, endTs
    ) as AppointmentDoc[];

    if (appointments.length === 0) {
      logger.info("Nenhum agendamento para lembrete (2 dias à frente)");
      return;
    }

    logger.info(`${appointments.length} agendamento(s) para lembrete`);

    for (const apt of appointments) {
      const clientPhone = apt.clientPhone?.trim();
      if (!clientPhone) {
        logger.warn(`Agendamento ${apt.id} sem telefone, lembrete não enviado`);
        continue;
      }
      const formattedPhone = formatPhoneForSms(clientPhone);
      if (!formattedPhone) {
        logger.warn(`Agendamento ${apt.id}: telefone inválido ${clientPhone}`);
        continue;
      }
      const date = apt.dateTime.toDate();
      const formattedDate = formatDateToBrazilian(date);
      const message =
        `Lembrete: seu agendamento (${apt.serviceName}) é ${formattedDate}. Beauty Booker`;

      try {
        await SmsService.sendSms({desc: message, recipients: [formattedPhone]});
        logger.info(`Lembrete enviado para ${formattedPhone} (agendamento ${apt.id})`);
      } catch (error: unknown) {
        logger.error(`Erro ao enviar lembrete para agendamento ${apt.id}:`, error);
      }
    }
  }
}
