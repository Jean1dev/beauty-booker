import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "@/lib/firebase";

export const uploadLogo = async (userId: string, file: File): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
    }

    const fileExtension = file.name.split(".").pop();
    const fileName = `logos/${userId}/logo.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error: any) {
    console.error("Erro ao fazer upload do logo:", error);
    throw error;
  }
};

export const deleteLogo = async (userId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
    }

    const extensions = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
    const deletePromises = extensions.map(async (ext) => {
      try {
        const filePath = `logos/${userId}/logo.${ext}`;
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      } catch (error: any) {
        if (error.code !== "storage/object-not-found") {
          throw error;
        }
      }
    });

    await Promise.all(deletePromises);
  } catch (error: any) {
    console.error("Erro ao deletar logo:", error);
    throw error;
  }
};

