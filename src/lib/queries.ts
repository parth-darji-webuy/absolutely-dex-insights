// One fetch per page load, shared by every card that needs it. Pages still get their data
// from src/lib/data.ts; this only stops several cards from asking for the same thing twice.
import { cache } from "react";
import { getExperiment, getExperiments, getOverview, getProducts } from "./data";

export const overview = cache(getOverview);
export const experiments = cache(getExperiments);
export const products = cache(getProducts);
export const experiment = cache(getExperiment);
