"use server";

import { redirect } from "next/navigation";
import { verifyAccountantPassword } from "@erp/core/accountant-portal";
import { setAccountantSession } from "@/lib/accountant-session";

export async function accountantLoginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Email and password are required." };
  }

  const accountant = await verifyAccountantPassword(email, password);
  if (!accountant) {
    return { error: "Invalid email or password." };
  }

  await setAccountantSession(accountant.id, accountant.email);
  redirect("/accountant");
}
