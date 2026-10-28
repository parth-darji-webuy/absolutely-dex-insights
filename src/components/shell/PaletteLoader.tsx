import { getExperiments } from "@/lib/data";
import { SUGGESTIONS } from "@/lib/ask/suggestions";
import { getEnv } from "@/lib/env";
import { CommandPalette } from "./CommandPalette";

/** Loads the experiment list for ⌘K without holding up the page. */
export async function PaletteLoader() {
  const experiments = await getExperiments();
  return <CommandPalette experiments={experiments.map(({ key, name, desc, status }) => ({ key, name, desc, status }))} suggestions={getEnv().AI_PROVIDER === "none" ? [] : SUGGESTIONS} />;
}
