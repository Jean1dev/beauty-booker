import * as logger from "firebase-functions/logger";

interface SendSmsRequest {
  desc: string;
  recipients: string[];
}

export class SmsService {
  private static readonly SMS_SERVICE_URL =
    process.env.SMS_SERVICE_URL ||
    "https://communication-service-4f4f57e0a956.herokuapp.com/notificacao/sms";

  static async sendSms(request: SendSmsRequest): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(this.SMS_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ao enviar SMS: ${response.status} - ${errorText}`
        );
      }

      logger.info(`SMS enviado com sucesso para ${request.recipients.join(", ")}`);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (error instanceof Error && error.name === "AbortError") {
        logger.error("Timeout ao enviar SMS: requisição excedeu 20 segundos");
        throw new Error("Timeout ao enviar SMS: requisição excedeu 20 segundos");
      }
      logger.error("Erro ao enviar SMS:", errorMessage);
      throw error;
    }
  }
}

