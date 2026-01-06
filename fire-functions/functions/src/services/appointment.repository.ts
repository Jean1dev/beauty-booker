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

  static async getAppointment(
    appointmentId: string
  ): Promise<admin.firestore.DocumentData & { id: string }> {
    const doc = await admin.firestore()
      .collection(this.COLLECTION)
      .doc(appointmentId)
      .get();

    if (!doc.exists) {
      throw new Error("Agendamento não encontrado");
    }

    return {id: doc.id, ...doc.data()};
  }

  static async cancelAppointment(appointmentId: string): Promise<void> {
    await admin.firestore()
      .collection(this.COLLECTION)
      .doc(appointmentId)
      .update({
        status: "cancelled",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }
}

