import { auth } from "@/auth";
import { NextResponse } from "next/server";

// /admin has its own cookie-based auth (requireAdmin(), not NextAuth) — see lib/admin-session.ts.
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth", "/admin"];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((path) => req.nextUrl.pathname.startsWith(path));
  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
