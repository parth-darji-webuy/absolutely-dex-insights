import { getStoreLast30 } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

/** The Store card's numbers for the last STORE_REFRESH_MINUTES minutes. 401 unless signed in. */
export async function GET() {
  if (!(await getCurrentUser())) return Response.json({ error: "Not signed in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    return Response.json(await getStoreLast30(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Store last-30 failed:", error instanceof Error ? error.message.split("\n")[0] : "unknown error");
    return Response.json({ error: "Couldn’t read the store numbers." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
