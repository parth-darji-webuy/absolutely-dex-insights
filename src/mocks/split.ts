import type { DailySplit } from "@/types";

// Daily people per variant. The add-to-cart test uses hand-set numbers that sum to 1,000 / 1,000
// and end on the 106 / 76 day behind the traffic-split warning.
export const DAILY_SPLIT: Record<string, DailySplit> = {
  "add-to-cart": {
    c: [74, 82, 86, 88, 91, 93, 92, 94, 91, 103, 106],
    t: [76, 86, 90, 92, 94, 97, 96, 98, 95, 100, 76],
  },
};
