"use server";

import { getStoreLast30 } from "@/lib/data";
import type { StoreLast30 } from "@/types";

/** Reloads the "Store · last 30 minutes" card on its own. */
export async function refreshStore(): Promise<StoreLast30> {
  return getStoreLast30();
}
