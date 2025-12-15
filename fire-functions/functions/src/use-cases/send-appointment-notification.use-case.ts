import {EmailService} from "../services/email.service";
import {SmsService} from "../services/sms.service";
import {AppointmentData} from "../types/google-calendar.types";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export class SendAppointmentNotificationUseCase {
  private static formatDateToBrazilian(date: Date): string {
    const daysOfWeek = [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
    ];

    const months = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];

    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${dayOfWeek}, ${day} de ${month} às ${hours}:${minutes}`;
  }

  private static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      return cleaned.substring(1);
    }
    return cleaned;
  }

  private static async getUserEmail(userId: string): Promise<string | null> {
    try {
      const userRecord = await admin.auth().getUser(userId);
      return userRecord.email || null;
    } catch (error: unknown) {
      logger.error(`Erro ao buscar email do usuário ${userId}:`, error);
      return null;
    }
  }

  private static createSmsDescription(
    serviceName: string
  ): string {
    return `Novo agendamento: ${serviceName} `;
  }

  private static async sendEmailNotification(
    userEmail: string,
    appointment: AppointmentData,
    formattedDate: string
  ): Promise<void> {
    await EmailService.sendEmail({
      to: userEmail,
      subject: "Novo Agendamento",
      message: "Você recebeu um novo agendamento",
      templateCode: 4,
      customBodyProps: {
        appointmentDate: formattedDate,
        serviceType: appointment.serviceName,
        clientName: appointment.clientName,
      },
    });

    logger.info(`Email de agendamento enviado para ${userEmail}`);
  }

  private static async sendSmsNotification(
    appointment: AppointmentData,
  ): Promise<void> {
    const formattedPhone = this.formatPhoneNumber("+55 48 9914-7211");
    const smsDescription = this.createSmsDescription(
      appointment.serviceName
    );

    await SmsService.sendSms({
      desc: smsDescription,
      recipients: [formattedPhone],
    });

    logger.info(`SMS de agendamento enviado para ${formattedPhone}`);
  }

  static async execute(
    userId: string,
    appointment: AppointmentData
  ): Promise<void> {
    try {
      const userEmail = await this.getUserEmail(userId);

      if (!userEmail) {
        logger.warn(`Usuário ${userId} não tem email cadastrado`);
        return;
      }

      const appointmentDate = appointment.dateTime.toDate();
      const formattedDate = this.formatDateToBrazilian(appointmentDate);

      await this.sendEmailNotification(userEmail, appointment, formattedDate);
      await this.sendSmsNotification(appointment);
    } catch (error: unknown) {
      logger.error("Erro ao enviar notificação de agendamento:", error);
    }
  }
}

