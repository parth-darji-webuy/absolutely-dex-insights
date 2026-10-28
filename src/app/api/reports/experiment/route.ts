import { connection } from "next/server";
import { getEnv } from "@/lib/env";
import { buildReport, reportCsv, safeFilePart } from "@/lib/report";
import { parseReportQuery } from "@/lib/report-period";
import { getCurrentUser } from "@/lib/session";
import { ADMIN } from "@/config/accounts";
import { getExperiment, getReportRows } from "@/lib/data";
import { localDay } from "@/lib/tz";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (status: number, error: string) => Response.json({ error }, { status, headers: NO_STORE });

/**
 * One experiment's daily results for a period, as a CSV download.
 * 401 signed out, 400 bad query, 404 unknown experiment or "Not running in this period".
 */
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return fail(401, "Not signed in.");
  await connection();
  const env = getEnv();
  const q = parseReportQuery(new URL(request.url).searchParams, { today: localDay(new Date(), env.INSIGHTS_TIMEZONE), trackingStart: env.TRACKING_START });
  if (!q.ok) return fail(400, q.message);
  try {
    const exp = await getExperiment(q.key);
    if (!exp) return fail(404, "That experiment doesn’t exist.");
    const rows = await getReportRows(q.key, q.from, q.to);
    if (rows.length === 0) return fail(404, "Not running in this period");
    const report = buildReport({ key: q.key, name: exp.name }, rows, q.from, q.to, `${ADMIN.name} (${ADMIN.role})`, env.INSIGHTS_TIMEZONE);
    return new Response(reportCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeFilePart(report.file)}"`,
        "X-Report-Name": encodeURIComponent(report.name),
        "X-Report-Rows": String(rows.length),
        ...NO_STORE,
      },
    });
  } catch (error) {
    console.error("Report failed:", error instanceof Error ? error.message.split("\n")[0] : "unknown error");
    return fail(500, "Couldn’t build the report.");
  }
}
