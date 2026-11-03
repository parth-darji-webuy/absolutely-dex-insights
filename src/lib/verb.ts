import type { Experiment } from "@/types";

/** What people on one side did. The menu-link test names the link each side showed, so it reads "clicked “New Arrivals”". */
export const verbFor = (e: Experiment, side: "c" | "t"): string =>
  e.preview === "whatsnew" && e[side].label ? `clicked “${e[side].label}”` : e.verb;
