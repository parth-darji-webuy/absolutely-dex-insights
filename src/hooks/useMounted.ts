"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False on the server and while the page hydrates, true afterwards. For things that can only exist in the browser, like portals. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
