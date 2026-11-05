import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to sign the admin session cookie");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * A minimal signed-cookie session for the platform-admin panel, separate
 * from NextAuth (which is tenant-scoped — a platform admin isn't a row in
 * `users` and isn't scoped to any tenant, so reusing NextAuth's session
 * here doesn't fit). HMAC-signed JSON, no encryption — the payload
 * (admin id + email) isn't secret, only tamper-proofing matters.
 */
export async function setAdminSession(adminId: string, email: string): Promise<void> {
  const payload = JSON.stringify({ adminId, email, iat: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = sign(encoded);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${encoded}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export interface AdminSession {
  adminId: string;
  email: string;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (Date.now() - payload.iat > MAX_AGE_SECONDS * 1000) return null;
    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}
