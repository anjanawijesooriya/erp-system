"use server";

import { revalidatePath } from "next/cache";
import { db } from "@erp/db";
import { productVariants } from "@erp/db/schema";
import { eq, and } from "drizzle-orm";
import { bomInput, createBom, deactivateBom } from "@erp/core/manufacturing";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { assertModule } from "@erp/core/plans";
import { requireSession } from "@/lib/session";

/**
 * Component lines come in as one SKU/quantity pair per line of a textarea
 * ("SKU,quantity") rather than dynamic client-side rows — same
 * one-input-per-fact simplicity as the rest of this app's single-line
 * forms, just extended to a short list since a BOM genuinely needs more
 * than one component.
 */
function parseLines(raw: string): { sku: string; quantity: number }[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [sku, qty] = l.split(",").map((s) => s.trim());
      return { sku, quantity: Number(qty) };
    });
}

export async function createBomAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const { tenantId, userId } = await requireSession();
  await assertModule(tenantId, "manufacturing");
  await assertCan(userId, PERMISSIONS.BOM_MANAGE);

  const outputVariantId = String(formData.get("outputVariantId") ?? "");
  const name = String(formData.get("name") ?? "");
  const outputQuantity = Number(formData.get("outputQuantity"));
  const rawLines = String(formData.get("lines") ?? "");

  const lineRows = parseLines(rawLines);
  if (lineRows.length === 0) return { error: "At least one component line is required (SKU,quantity)" };

  const lines: { componentVariantId: string; quantity: number }[] = [];
  for (const row of lineRows) {
    const variant = await db.query.productVariants.findFirst({
      where: and(eq(productVariants.tenantId, tenantId), eq(productVariants.sku, row.sku)),
    });
    if (!variant) return { error: `No product variant found for SKU "${row.sku}"` };
    lines.push({ componentVariantId: variant.id, quantity: row.quantity });
  }

  const parsed = bomInput.safeParse({ outputVariantId, name, outputQuantity, lines });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  await createBom(tenantId, parsed.data);
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
