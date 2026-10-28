import { isTrackingTable, TRACKING_TABLES, type TrackingTable } from "./tables";

export const ID_MAX = 64;

export type DetailQuery = { ok: true; table: TrackingTable; id: string } | { ok: false; message: string };

/** Checks ?tbl= and ?id= for the event detail route. Nothing but the six tracking tables gets through. */
export function parseDetailQuery(params: URLSearchParams): DetailQuery {
  const tbl = params.get("tbl");
  const id = params.get("id");
  if (!isTrackingTable(tbl)) return { ok: false, message: `tbl must be one of: ${TRACKING_TABLES.join(", ")}.` };
  if (!id) return { ok: false, message: "id is required." };
  if (id.length > ID_MAX) return { ok: false, message: `id can be at most ${ID_MAX} characters.` };
  return { ok: true, table: tbl, id };
}
