"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

const settingsInput = z.object({
  ownerPhone: z.string().max(20).optional(),
});

export async function updateSettingsAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE);

  const parsed = settingsInput.safeParse({ ownerPhone: formData.get("ownerPhone") || undefined });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await db
    .update(tenants)
    .set({ ownerPhone: parsed.data.ownerPhone ?? null, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  revalidatePath("/settings");
  return {};
}
