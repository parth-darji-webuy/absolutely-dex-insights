import { notFound } from "next/navigation";

// Any address that isn't a real page shows "Page not found" inside the app shell.
// This page always throws, so there is nothing for the dev-only instant-navigation check to render.
export const instant = false;

export default function CatchAll() {
  notFound();
}
