// Runs once when the server starts. The Node-only part lives in its own file so the Edge runtime never sees it.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") (await import("./instrumentation-node")).checkEnvAtStart();
}
