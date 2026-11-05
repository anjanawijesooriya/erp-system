"use server";

import { redirect } from "next/navigation";
import { verifyPlatformAdminPassword } from "@erp/core/platform-admin";
import { setAdminSession } from "@/lib/admin-session";

export async function adminLoginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email and password are required." };
  }

  const admin = await verifyPlatformAdminPassword(email, password);
  if (!admin) {
    return { error: "Invalid email or password." };
  }

  await setAdminSession(admin.id, admin.email);
  redirect("/admin");
}
