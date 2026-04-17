import {EmailService} from "../services/email.service";
import {SmsService} from "../services/sms.service";
import {AppointmentData} from "../types/google-calendar.types";
import {
  formatDateToBrazilian,
  formatPhoneForSms,
} from "../utils/brazil-format";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

export class SendAppointmentNotificationUseCase {
  private static async getUserEmail(userId: string): Promise<string | null> {
    try {
      const userRecord = await admin.auth().getUser(userId);
      return userRecord.email || null;
    } catch (error: unknown) {
      logger.error(`Erro ao buscar email do usuário ${userId}:`, error);
      return null;
    }
  }

  private static readonly PROFESSIONAL_PHONE = "5548991477211";

  private static createSmsToProfessional(
    serviceName: string,
    formattedDate: string,
    clientName: string
  ): string {
    return `Novo agendamento: ${serviceName} - ${clientName} - ${formattedDate}. Beauty Booker`;
  }

  private static createSmsToClient(
    serviceName: string,
    formattedDate: string
  ): string {
    return `Seu agendamento: ${serviceName} - ${formattedDate}. Beauty Booker`;
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

  private static async sendSmsToProfessional(
    appointment: AppointmentData,
    formattedDate: string
  ): Promise<void> {
    const message = this.createSmsToProfessional(
      appointment.serviceName,
      formattedDate,
      appointment.clientName
    );
    await SmsService.sendSms({
      desc: message,
      recipients: [this.PROFESSIONAL_PHONE],
    });
    logger.info(`SMS de novo agendamento enviado para ${this.PROFESSIONAL_PHONE}`);
  }

  private static async sendSmsToClient(
    appointment: AppointmentData,
    formattedDate: string
  ): Promise<void> {
    const clientPhone = appointment.clientPhone?.trim();
    if (!clientPhone) {
      logger.warn("Agendamento sem telefone do cliente, SMS não enviado");
      return;
    }
    const formattedPhone = formatPhoneForSms(clientPhone);
    if (!formattedPhone) {
      logger.warn(`Telefone inválido para SMS: ${clientPhone}`);
      return;
    }
    const message = this.createSmsToClient(
      appointment.serviceName,
      formattedDate
    );
    await SmsService.sendSms({
      desc: message,
      recipients: [formattedPhone],
    });
    logger.info(`SMS de confirmação enviado para o cliente ${formattedPhone}`);
  }

  static async execute(
    userId: string,
    appointment: AppointmentData
  ): Promise<void> {
    try {
      const appointmentDate = appointment.dateTime.toDate();
      const formattedDate = formatDateToBrazilian(appointmentDate);

      const userEmail = await this.getUserEmail(userId);
      if (userEmail) {
        await this.sendEmailNotification(userEmail, appointment, formattedDate);
      } else {
        logger.warn(`Usuário ${userId} não tem email cadastrado`);
      }

      await this.sendSmsToProfessional(appointment, formattedDate);
      await this.sendSmsToClient(appointment, formattedDate);
    } catch (error: unknown) {
      logger.error("Erro ao enviar notificação de agendamento:", error);
    }
  }
}

