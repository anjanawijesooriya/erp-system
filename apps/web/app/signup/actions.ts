"use server";

import { redirect } from "next/navigation";
import { onboardingInput, onboardTenant, SlugTakenError } from "@erp/core/tenants";

export async function signupAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = onboardingInput.safeParse({
    shopName: formData.get("shopName"),
    slug: formData.get("slug"),
    businessType: formData.get("businessType") || undefined,
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await onboardTenant(parsed.data);
  } catch (err) {
    if (err instanceof SlugTakenError) {
      return { error: err.message };
    }
    return { error: err instanceof Error ? err.message : "Signup failed" };
  }

  redirect(`/login?callbackUrl=/dashboard&shop=${parsed.data.slug}`);
}
