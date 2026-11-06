"use server";

import { revalidatePath } from "next/cache";
import { documentBrandingInput, upsertDocumentBranding } from "@erp/core/tenants";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function saveDocumentBrandingAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE);

  const parsed = documentBrandingInput.safeParse({
    logoUrl: formData.get("logoUrl") || undefined,
    primaryColor: formData.get("primaryColor"),
    companyAddress: formData.get("companyAddress") || undefined,
    companyPhone: formData.get("companyPhone") || undefined,
    companyEmail: formData.get("companyEmail") || undefined,
    footerNote: formData.get("footerNote") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await upsertDocumentBranding(tenantId, parsed.data);
  revalidatePath("/settings/invoice-branding");
  revalidatePath("/sales/invoices");
  return {};
}
