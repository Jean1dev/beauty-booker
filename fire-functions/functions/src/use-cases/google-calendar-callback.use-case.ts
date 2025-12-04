import {OAuthService} from "../services/oauth.service";
import {IntegrationRepository} from "../services/integration.repository";
import * as logger from "firebase-functions/logger";

export class GoogleCalendarCallbackUseCase {
  static async execute(code: string, state: string): Promise<string> {
    if (!code || !state) {
      throw new Error("Parâmetros code ou state ausentes");
    }

    const stateData = JSON.parse(state);
    const uid = stateData.uid;

    if (!uid) {
      throw new Error("UID não encontrado no state");
    }

    try {
      const tokens = await OAuthService.getToken(code);
      const googleUserId = tokens.id_token ?
        await OAuthService.getGoogleUserId(tokens.id_token) :
        "";

      await IntegrationRepository.save(uid, tokens, googleUserId);

      const appUrl = process.env.APP_URL || "http://localhost:5173";
      return `${appUrl}/appointments?connected=success`;
    } catch (error: unknown) {
      logger.error("Erro no callback do Google Calendar:", error);
      const appUrl = process.env.APP_URL || "http://localhost:5173";
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${appUrl}/appointments?connected=error&message=${
          encodeURIComponent(errorMessage)
        }`
      );
    }
  }
}

