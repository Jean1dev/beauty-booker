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

  private static formatPhoneForSms(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 10) return null;
    let digits = cleaned;
    if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.substring(1);
    }
    if (!digits.startsWith("55")) {
      digits = "55" + digits;
    }
    return digits;
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
    const formattedPhone = this.formatPhoneForSms(clientPhone);
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
      const formattedDate = this.formatDateToBrazilian(appointmentDate);

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

