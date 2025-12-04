if (process.env.FUNCTIONS_EMULATOR === "true" || process.env.FIREBASE_CONFIG === undefined) {
  try {
    const dotenv = require("dotenv");
    const path = require("path");
    dotenv.config({path: path.join(__dirname, "../.env.local")});
  } catch (error: unknown) {
  }
}

