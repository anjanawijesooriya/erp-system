import { and, eq } from "drizzle-orm";
import { db } from "@erp/db";
import { productUomConversions, productVariants, products } from "@erp/db/schema";
import { getOrCreateUomByCode } from "./uom";
import { assertWithinLimit } from "../plans/feature-gate";
import type { ProductInput } from "./schemas";

/**
 * Creates a product with its base UoM, any extra UoM conversions, and a
 * single default variant carrying the price/cost/barcode. Every product
 * has at least one variant (see schema comment on product_variants) so
 * callers never need to special-case "no variants yet".
 */
export async function createProduct(tenantId: string, input: ProductInput) {
  await assertWithinLimit(tenantId, "maxProducts");

  return db.transaction(async (tx) => {
    const baseUom = await getOrCreateUomByCode(tx, tenantId, input.baseUomCode);
    if (!baseUom) throw new Error("Failed to resolve base unit of measure");

    const [product] = await tx
      .insert(products)
      .values({
        tenantId,
        sku: input.sku,
        name: input.name,
        description: input.description,
        baseUomId: baseUom.id,
        tracksBatches: input.tracksBatches,
      })
      .returning();
    if (!product) throw new Error("Failed to create product");

    await tx.insert(productVariants).values({
      tenantId,
      productId: product.id,
      sku: input.sku,
      name: "Default",
      barcode: input.barcode,
      costPrice: input.costPrice.toString(),
      sellingPrice: input.sellingPrice.toString(),
    });

    for (const conversion of input.conversions) {
      if (conversion.uomCode === input.baseUomCode) continue; // base unit has an implicit factor of 1
      const uom = await getOrCreateUomByCode(tx, tenantId, conversion.uomCode);
      if (!uom) continue;
      await tx.insert(productUomConversions).values({
        tenantId,
        productId: product.id,
        uomId: uom.id,
        factor: conversion.factor.toString(),
      });
    }

    return product;
  });
}

export async function listProducts(tenantId: string) {
  return db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
    orderBy: (p, { asc }) => [asc(p.name)],
    with: {
      variants: true,
    },
  });
}

export async function getProductVariantBySkuOrBarcode(tenantId: string, code: string) {
  return db.query.productVariants.findFirst({
    where: (v, { or: orOp }) =>
      and(eq(v.tenantId, tenantId), orOp(eq(v.sku, code), eq(v.barcode, code))),
  });
}
