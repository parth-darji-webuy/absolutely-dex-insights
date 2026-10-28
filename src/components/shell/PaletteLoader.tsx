import { getExperiments } from "@/lib/data";
import { SUGGESTIONS } from "@/mocks";
import { CommandPalette } from "./CommandPalette";

/** Loads the experiment list for ⌘K without holding up the page. */
export async function PaletteLoader() {
  const experiments = await getExperiments();
  return <CommandPalette experiments={experiments.map(({ key, name, desc, status }) => ({ key, name, desc, status }))} suggestions={SUGGESTIONS} />;
}
