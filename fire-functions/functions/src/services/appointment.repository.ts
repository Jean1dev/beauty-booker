import * as admin from "firebase-admin";

export class AppointmentRepository {
  private static readonly COLLECTION = "appointments";

  static async updateGoogleCalendarEventId(
    appointmentId: string,
    googleCalendarEventId: string
  ): Promise<void> {
    await admin.firestore()
      .collection(this.COLLECTION)
      .doc(appointmentId)
      .update({
        googleCalendarEventId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }
}

