import { listProducts } from "@erp/core/catalog";

export interface VariantOption {
  id: string;
  label: string;
}

export async function getVariantOptions(tenantId: string): Promise<VariantOption[]> {
  const products = await listProducts(tenantId);
  return products.flatMap((p) =>
    p.variants.map((v) => ({ id: v.id, label: `${v.sku} — ${p.name}` })),
  );
}
