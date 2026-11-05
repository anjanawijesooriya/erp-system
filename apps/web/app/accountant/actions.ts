"use server";

import { redirect } from "next/navigation";
import { clearAccountantSession } from "@/lib/accountant-session";

export async function accountantLogoutAction() {
  await clearAccountantSession();
  redirect("/accountant/login");
}
