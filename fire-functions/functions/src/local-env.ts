if (process.env.FUNCTIONS_EMULATOR === "true" || process.env.FIREBASE_CONFIG === undefined) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require("dotenv");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path");
    dotenv.config({path: path.join(__dirname, "../.env.local")});
  } catch (error: unknown) {
    // Ignorar erro se dotenv não estiver disponível
  }
}

