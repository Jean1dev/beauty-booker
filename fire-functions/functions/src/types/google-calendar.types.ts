export interface GoogleCalendarIntegration {
  userId: string;
  googleUserId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope: string;
  tokenType: string;
  syncToken?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CreateCalendarEventRequest {
  startDateTime: string;
  endDateTime: string;
  summary: string;
  description?: string;
}

export interface CreateCalendarEventResponse {
  eventId: string;
  htmlLink?: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

export interface AppointmentData {
  userId: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
  dateTime: any;
  duration?: number;
  durationUnit?: "min" | "hour";
}

