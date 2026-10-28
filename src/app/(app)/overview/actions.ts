"use server";

import { getStoreLast30 } from "@/lib/data";
import { assertSignedIn } from "@/lib/session";
import type { StoreLast30 } from "@/types";

/** Reloads the "Store · last 30 minutes" card on its own. */
export async function refreshStore(): Promise<StoreLast30> {
  await assertSignedIn();
  return getStoreLast30();
}
