"use server";

import { revalidatePath } from "next/cache";
import { bomInput, createBom, deactivateBom } from "@erp/core/manufacturing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

export async function createBomAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "manufacturing");
  await assertCan(userId, PERMISSIONS.BOM_MANAGE);

  const linesRaw = formData.get("lines");
  let lines: unknown;
  try {
    lines = JSON.parse(typeof linesRaw === "string" ? linesRaw : "[]");
  } catch {
    return { error: "Invalid component lines." };
  }

  const parsed = bomInput.safeParse({
    outputVariantId: formData.get("outputVariantId"),
    name: formData.get("name"),
    outputQuantity: formData.get("outputQuantity"),
    lines,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    await createBom(tenantId, parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create BOM" };
  }

  revalidatePath("/manufacturing/bom");
  return {};
}

export async function deactivateBomAction(bomId: string) {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "manufacturing");
  await assertCan(userId, PERMISSIONS.BOM_MANAGE);
  await deactivateBom(tenantId, bomId);
  revalidatePath("/manufacturing/bom");
}
