import {OAuthService} from "../services/oauth.service";
import {CalendarService} from "../services/calendar.service";
import {
  CreateCalendarEventRequest,
  CreateCalendarEventResponse,
} from "../types/google-calendar.types";
import * as logger from "firebase-functions/logger";

export class CreateCalendarEventUseCase {
  static async execute(
    uid: string,
    eventData: CreateCalendarEventRequest
  ): Promise<CreateCalendarEventResponse> {
    if (!eventData.startDateTime || !eventData.endDateTime || !eventData.summary) {
      throw new Error("Parâmetros obrigatórios ausentes");
    }

    try {
      const client = await OAuthService.getAuthenticatedClient(uid);
      return await CalendarService.createEvent(client, eventData);
    } catch (error: unknown) {
      logger.error("Erro ao criar evento no Google Calendar:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Erro ao criar evento: ${errorMessage}`);
    }
  }
}

