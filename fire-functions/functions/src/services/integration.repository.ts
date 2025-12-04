import * as admin from "firebase-admin";
import {GoogleCalendarIntegration, OAuthTokens} from "../types/google-calendar.types";

export class IntegrationRepository {
  private static readonly COLLECTION = "googleCalendarIntegrations";

  static async save(uid: string, tokens: OAuthTokens, googleUserId: string): Promise<void> {
    const integrationData: Omit<GoogleCalendarIntegration, "syncToken"> = {
      userId: uid,
      googleUserId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date || Date.now() + 3600000,
      scope: tokens.scope || "https://www.googleapis.com/auth/calendar.events",
      tokenType: tokens.token_type || "Bearer",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore()
      .collection(this.COLLECTION)
      .doc(uid)
      .set(integrationData, {merge: true});
  }

  static async exists(uid: string): Promise<boolean> {
    const doc = await admin.firestore()
      .collection(this.COLLECTION)
      .doc(uid)
      .get();

    return doc.exists;
  }

  static async delete(uid: string): Promise<void> {
    await admin.firestore()
      .collection(this.COLLECTION)
      .doc(uid)
      .delete();
  }
}

