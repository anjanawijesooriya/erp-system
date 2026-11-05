import { z } from "zod";

export const warehouseInput = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40),
});
export type WarehouseInput = z.infer<typeof warehouseInput>;

export const transferLineInput = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  batchNumber: z.string().optional(),
});

export const transferInput = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  note: z.string().max(500).optional(),
  lines: z.array(transferLineInput).min(1),
});
export type TransferInput = z.infer<typeof transferInput>;

export const adjustmentLineInput = z.object({
  productVariantId: z.string().uuid(),
  quantityDelta: z.coerce.number().refine((n) => n !== 0, "Quantity delta cannot be zero"),
  unitCost: z.coerce.number().nonnegative().optional().default(0),
  batchNumber: z.string().optional(),
});

export const adjustmentInput = z.object({
  warehouseId: z.string().uuid(),
  reason: z.enum(["damage", "theft_loss", "expiry", "correction", "other"]),
  note: z.string().max(500).optional(),
  lines: z.array(adjustmentLineInput).min(1),
});
export type AdjustmentInput = z.infer<typeof adjustmentInput>;

export const startStockCountInput = z.object({
  warehouseId: z.string().uuid(),
  note: z.string().max(500).optional(),
  productVariantIds: z.array(z.string().uuid()).min(1),
});
export type StartStockCountInput = z.infer<typeof startStockCountInput>;

export const reorderLevelInput = z.object({
  warehouseId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  reorderLevel: z.coerce.number().nonnegative(),
  reorderQty: z.coerce.number().nonnegative(),
});
export type ReorderLevelInput = z.infer<typeof reorderLevelInput>;
