import * as admin from "firebase-admin";

export interface GoogleCalendarIntegration {
  userId: string;
  googleUserId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope: string;
  tokenType: string;
  syncToken?: string;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
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
  dateTime: admin.firestore.Timestamp;
  duration?: number;
  durationUnit?: "min" | "hour";
}

