import {google} from "googleapis";
import type {Auth} from "googleapis";
import {
  CreateCalendarEventRequest,
  CreateCalendarEventResponse,
} from "../types/google-calendar.types";

export class CalendarService {
  static async createEvent(
    client: Auth.OAuth2Client,
    eventData: CreateCalendarEventRequest
  ): Promise<CreateCalendarEventResponse> {
    const calendar = google.calendar({version: "v3", auth: client});

    const event = {
      summary: eventData.summary,
      description: eventData.description || "",
      start: {
        dateTime: eventData.startDateTime,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: "America/Sao_Paulo",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return {
      eventId: response.data.id || "",
      htmlLink: response.data.htmlLink || undefined,
    };
  }
}

