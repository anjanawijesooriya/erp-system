import { z } from "zod";

export const uomInput = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
});
export type UomInput = z.infer<typeof uomInput>;

export const uomConversionInput = z.object({
  uomCode: z.string().min(1),
  factor: z.coerce.number().positive(),
});

export const productInput = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  baseUomCode: z.string().min(1),
  tracksBatches: z.boolean().optional().default(false),
  costPrice: z.coerce.number().nonnegative().optional().default(0),
  sellingPrice: z.coerce.number().nonnegative().optional().default(0),
  barcode: z.string().max(64).optional(),
  conversions: z.array(uomConversionInput).optional().default([]),
});
export type ProductInput = z.infer<typeof productInput>;

export const updateProductInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tracksBatches: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  costPrice: z.coerce.number().nonnegative().optional().default(0),
  sellingPrice: z.coerce.number().nonnegative().optional().default(0),
  barcode: z.string().max(64).optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductInput>;
