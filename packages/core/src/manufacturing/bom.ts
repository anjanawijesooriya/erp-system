import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { billOfMaterialLines, billOfMaterials } from "@erp/db/schema";
import { z } from "zod";

export const bomInput = z.object({
  outputVariantId: z.string().uuid(),
  name: z.string().min(1),
  outputQuantity: z.coerce.number().positive(),
  lines: z
    .array(
      z.object({
        componentVariantId: z.string().uuid(),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1),
});
export type BomInput = z.infer<typeof bomInput>;

export async function createBom(tenantId: string, input: BomInput) {
  return db.transaction(async (tx) => {
    const [bom] = await tx
      .insert(billOfMaterials)
      .values({
        tenantId,
        outputVariantId: input.outputVariantId,
        name: input.name,
        outputQuantity: input.outputQuantity.toString(),
      })
      .returning();
    if (!bom) throw new Error("Failed to create BOM");

    for (const line of input.lines) {
      await tx.insert(billOfMaterialLines).values({
        bomId: bom.id,
        componentVariantId: line.componentVariantId,
        quantity: line.quantity.toString(),
      });
    }
    return bom;
  });
}

export async function listBoms(tenantId: string) {
  return db.query.billOfMaterials.findMany({
    where: and(eq(billOfMaterials.tenantId, tenantId), eq(billOfMaterials.isActive, true)),
    with: { outputVariant: true, lines: { with: { componentVariant: true } } },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

export async function getBom(tenantId: string, bomId: string) {
  return db.query.billOfMaterials.findFirst({
    where: and(eq(billOfMaterials.id, bomId), eq(billOfMaterials.tenantId, tenantId)),
    with: { outputVariant: true, lines: { with: { componentVariant: true } } },
  });
}

export async function deactivateBom(tenantId: string, bomId: string) {
  const [row] = await db
    .update(billOfMaterials)
    .set({ isActive: false })
    .where(and(eq(billOfMaterials.id, bomId), eq(billOfMaterials.tenantId, tenantId)))
    .returning();
  return row;
}
