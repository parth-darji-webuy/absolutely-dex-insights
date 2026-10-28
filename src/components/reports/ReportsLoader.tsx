import { getEnv } from "@/lib/env";
import { localDay } from "@/lib/tz";
import { experiments } from "@/lib/queries";
import { ReportsPanel } from "./ReportsPanel";

/** Loads the experiment list, then hands over to the interactive Period and Reports cards. */
export async function ReportsLoader() {
  const list = await experiments();
  return (
    <ReportsPanel
      experiments={list.map(({ key, name, flag, metricShort, mtable, status, start }) => ({ key, name, flag, metricShort, mtable, status, start }))}
      today={localDay(new Date(), getEnv().INSIGHTS_TIMEZONE)}
      trackingStart={getEnv().TRACKING_START}
    />
  );
}
