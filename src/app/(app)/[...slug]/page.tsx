import { notFound } from "next/navigation";

// Any address that isn't a real page shows "Page not found" inside the app shell.
export default function CatchAll() {
  notFound();
}
