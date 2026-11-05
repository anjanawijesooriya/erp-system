import { listProducts } from "@erp/core/catalog";

export interface PosVariantOption {
  id: string;
  sku: string;
  label: string;
  sellingPrice: string;
}

export async function getPosVariantOptions(tenantId: string): Promise<PosVariantOption[]> {
  const products = await listProducts(tenantId);
  return products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: `${v.sku} — ${p.name}`,
      sellingPrice: v.sellingPrice,
    })),
  );
}
