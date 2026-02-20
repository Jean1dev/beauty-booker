import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {AppointmentRepository} from "../services/appointment.repository";
import {SmsService} from "../services/sms.service";

interface AppointmentDoc {
  id: string;
  userId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  dateTime: admin.firestore.Timestamp;
}

function formatDateToBrazilian(date: Date): string {
  const daysOfWeek = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado",
  ];
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const dayOfWeek = daysOfWeek[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${dayOfWeek}, ${day} de ${month} às ${hours}:${minutes}`;
}

function formatPhoneForSms(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 10) return null;
  let digits = cleaned;
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.substring(1);
  if (!digits.startsWith("55")) digits = "55" + digits;
  return digits;
}

export class SendAppointmentReminderUseCase {
  static async execute(): Promise<void> {
    const now = new Date();
    const targetDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0, 0);
    const endOfTargetDay = new Date(targetDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const startTs = admin.firestore.Timestamp.fromDate(targetDay);
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
