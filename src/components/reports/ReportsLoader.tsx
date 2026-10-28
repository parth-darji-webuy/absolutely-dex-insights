import { ACCOUNT } from "@/lib/mock-auth";
import { experiments } from "@/lib/queries";
import { ReportsPanel } from "./ReportsPanel";

/** Loads the experiment list, then hands over to the interactive Period and Reports cards. */
export async function ReportsLoader() {
  const list = await experiments();
  return (
    <ReportsPanel
      experiments={list.map(({ key, name, flag, metricShort, mtable, status, start }) => ({ key, name, flag, metricShort, mtable, status, start }))}
      generatedBy={`${ACCOUNT.name} (${ACCOUNT.role})`}
    />
  );
}
