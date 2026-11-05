import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "accountant_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to sign the accountant session cookie");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * A minimal signed-cookie session for the accountant portal, same
 * reasoning as apps/web/lib/admin-session.ts: an accountant isn't a row
 * in any one tenant's `users` table and isn't scoped to a single tenant,
 * so NextAuth's tenant-scoped session doesn't fit here either.
 */
export async function setAccountantSession(accountantId: string, email: string): Promise<void> {
  const payload = JSON.stringify({ accountantId, email, iat: Date.now() });
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

export async function clearAccountantSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export interface AccountantSession {
  accountantId: string;
  email: string;
}

export async function getAccountantSession(): Promise<AccountantSession | null> {
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
    return { accountantId: payload.accountantId, email: payload.email };
  } catch {
    return null;
  }
}

export async function requireAccountantSession(): Promise<AccountantSession> {
  const session = await getAccountantSession();
  if (!session) {
    redirect("/accountant/login");
  }
  return session;
}
