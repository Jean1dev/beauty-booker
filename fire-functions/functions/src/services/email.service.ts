import * as logger from "firebase-functions/logger";

interface SendEmailRequest {
  to: string;
  subject: string;
  message: string;
  templateCode: number;
  customBodyProps: {
    appointmentDate: string;
    serviceType: string;
    clientName: string;
  };
}

export class EmailService {
  private static readonly EMAIL_SERVICE_URL =
    process.env.EMAIL_SERVICE_URL ||
    "https://communication-service-4f4f57e0a956.herokuapp.com/email";

  static async sendEmail(request: SendEmailRequest): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(this.EMAIL_SERVICE_URL, {
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
          `Erro ao enviar email: ${response.status} - ${errorText}`
        );
      }

      logger.info(`Email enviado com sucesso para ${request.to}`);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (error instanceof Error && error.name === "AbortError") {
        logger.error("Timeout ao enviar email: requisição excedeu 20 segundos");
        throw new Error("Timeout ao enviar email: requisição excedeu 20 segundos");
      }
      logger.error("Erro ao enviar email:", errorMessage);
      throw error;
    }
  }
}

