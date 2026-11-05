import { auth } from "@/auth";
import { NextResponse } from "next/server";

// /admin and /accountant each have their own cookie-based auth (not
// NextAuth) — see lib/admin-session.ts and lib/accountant-session.ts; both
// pages do their own redirect-to-login, so they must bypass this
// NextAuth-only check entirely. /api/ecommerce is called by external
// storefronts with no tenant session at all, authenticated by apiKey/HMAC
// instead — see app/api/ecommerce/*.
const PUBLIC_PATHS = ["/login", "/signup", "/api/auth", "/admin", "/accountant", "/api/ecommerce"];

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
