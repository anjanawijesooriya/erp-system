import { listProducts } from "@erp/core/catalog";

export interface PosVariantOption {
  id: string;
  sku: string;
  name: string;
  label: string;
  sellingPrice: string;
}

export async function getPosVariantOptions(tenantId: string): Promise<PosVariantOption[]> {
  const products = await listProducts(tenantId);
  return products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name !== "Default" ? `${p.name} — ${v.name}` : p.name,
      label: `${v.sku} — ${p.name}`,
      sellingPrice: v.sellingPrice,
    })),
  );
}
