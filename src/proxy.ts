import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

// Signed out -> sign-in page. Signed in on the sign-in page -> Overview.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);

  if (!user && pathname !== "/sign-in") return NextResponse.redirect(new URL("/sign-in", request.url));
  if (user && pathname === "/sign-in") return NextResponse.redirect(new URL("/overview", request.url));
  return NextResponse.next();
}

export const config = {
  // Everything except Next's own files and the images in /public.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
