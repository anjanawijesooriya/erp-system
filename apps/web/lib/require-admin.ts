import { redirect } from "next/navigation";
import { getAdminSession, type AdminSession } from "./admin-session";

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
