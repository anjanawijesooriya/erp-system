import { redirect } from "next/navigation";
import { auth } from "@/auth";

export interface SessionContext {
  tenantId: string;
  userId: string;
  email: string;
}

/** Server-side guard: redirects to /login if there's no valid tenant-scoped session. */
export async function requireSession(): Promise<SessionContext> {
  const session = await auth();
  const user = session?.user as { tenantId?: string; id?: string; email?: string | null } | undefined;

  if (!session || !user?.tenantId || !user?.id) {
    redirect("/login");
  }

  return { tenantId: user.tenantId, userId: user.id, email: user.email ?? "" };
}
