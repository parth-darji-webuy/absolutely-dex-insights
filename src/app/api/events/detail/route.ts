import { parseDetailQuery } from "@/lib/api-params";
import { getCurrentUser } from "@/lib/session";
import { loadEventDetail } from "@/lib/store/events";
import { connection } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

/** One event row as stored, plus the visitor's journey around it. 401 signed out, 400 bad query, 404 no such row. */
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Not signed in." }, { status: 401, headers: NO_STORE });
  const q = parseDetailQuery(new URL(request.url).searchParams);
  if (!q.ok) return Response.json({ error: q.message }, { status: 400, headers: NO_STORE });
  await connection();
  try {
    const detail = await loadEventDetail(q.table, q.id);
    if (!detail) return Response.json({ error: "No such row." }, { status: 404, headers: NO_STORE });
    return Response.json(detail, { headers: NO_STORE });
  } catch (error) {
    console.error("Event detail failed:", error instanceof Error ? error.message.split("\n")[0] : "unknown error");
    return Response.json({ error: "Couldn’t read this row." }, { status: 500, headers: NO_STORE });
  }
}
