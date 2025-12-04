import {OAuthService} from "../services/oauth.service";

export class GetGoogleCalendarAuthUrlUseCase {
  static async execute(uid: string): Promise<{authUrl: string}> {
    const authUrl = OAuthService.generateAuthUrl(uid);
    return {authUrl};
  }
}

