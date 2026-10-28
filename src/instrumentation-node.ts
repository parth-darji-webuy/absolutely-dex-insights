import { EnvError, getEnv } from "./lib/env";

/** Checks .env when the server starts. A missing or bad value stops the app with one line. */
export function checkEnvAtStart() {
  try {
    getEnv();
  } catch (error) {
    if (error instanceof EnvError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}
