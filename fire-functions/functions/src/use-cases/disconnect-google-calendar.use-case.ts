import {IntegrationRepository} from "../services/integration.repository";

export class DisconnectGoogleCalendarUseCase {
  static async execute(uid: string): Promise<{success: boolean}> {
    await IntegrationRepository.delete(uid);
    return {success: true};
  }
}

