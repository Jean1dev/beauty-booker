import {IntegrationRepository} from "../services/integration.repository";

export class CheckGoogleCalendarConnectionUseCase {
  static async execute(uid: string): Promise<{connected: boolean}> {
    const connected = await IntegrationRepository.exists(uid);
    return {connected};
  }
}

