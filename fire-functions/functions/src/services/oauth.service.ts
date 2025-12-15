import {google} from "googleapis";
import type {Auth} from "googleapis";
import * as admin from "firebase-admin";
import {GoogleCalendarIntegration, OAuthTokens} from "../types/google-calendar.types";

export class OAuthService {
  private static getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const projectId = (process.env.GCLOUD_PROJECT || admin.app().options.projectId)?.trim();
    const region = (process.env.FUNCTION_REGION || "us-central1")?.trim();
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    const redirectUri = (process.env.GOOGLE_REDIRECT_URI?.trim() ||
      (isEmulator ?
        `http://localhost:5001/${projectId}/us-central1/googleCalendarCallback` :
        `https://${region}-${projectId}.cloudfunctions.net/googleCalendarCallback`))?.trim();

    if (!clientId || !clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET devem estar configurados");
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  static generateAuthUrl(uid: string): string {
    const oauth2Client = this.getOAuth2Client();
    const state = JSON.stringify({uid});

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state,
    });
  }

  static async getToken(code: string): Promise<OAuthTokens> {
    const oauth2Client = this.getOAuth2Client();
    const {tokens} = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Tokens não recebidos corretamente");
    }

    return tokens as OAuthTokens;
  }

  static async getGoogleUserId(idToken: string): Promise<string> {
    try {
      const oauth2Client = this.getOAuth2Client();
      const ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID?.trim(),
      });
      return ticket.getUserId() || "";
    } catch {
      return "";
    }
  }

  static async getAuthenticatedClient(uid: string): Promise<Auth.OAuth2Client> {
    const integration = await this.getIntegration(uid);
    const oauth2Client = this.getOAuth2Client();

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiryDate,
      token_type: integration.tokenType,
    });

    oauth2Client.on("tokens", async (tokens: unknown) => {
      const tokenData = tokens as {access_token?: string; expiry_date?: number};
      if (tokenData.access_token) {
        await this.updateAccessToken(
          uid,
          tokenData.access_token,
          tokenData.expiry_date
        );
      }
    });

    return oauth2Client;
  }

  private static async getIntegration(uid: string): Promise<GoogleCalendarIntegration> {
    const doc = await admin.firestore()
      .collection("googleCalendarIntegrations")
      .doc(uid)
      .get();

    if (!doc.exists) {
      throw new Error("Usuário não conectado ao Google Calendar");
    }

    return doc.data() as GoogleCalendarIntegration;
  }

  private static async updateAccessToken(
    uid: string,
    accessToken: string,
    expiryDate?: number
  ): Promise<void> {
    await admin.firestore()
      .collection("googleCalendarIntegrations")
      .doc(uid)
      .update({
        accessToken,
        expiryDate: expiryDate || Date.now() + 3600000,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }
}

