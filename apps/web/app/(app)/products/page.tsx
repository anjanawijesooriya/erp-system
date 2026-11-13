import { listProducts } from "@erp/core/catalog";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { PackageIcon } from "@/components/icons";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const { tenantId, userId } = await requireSession();
  const [products, canSeeCost, canManage] = await Promise.all([
    listProducts(tenantId),
    can(userId, PERMISSIONS.PRODUCT_COST_PRICE_VIEW),
    can(userId, PERMISSIONS.PRODUCT_MANAGE),
  ]);

  const rows = products.map((p) => {
    const variant = p.variants[0];
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      tracksBatches: p.tracksBatches,
      isActive: p.isActive,
      costPrice: variant?.costPrice ?? "0",
      sellingPrice: variant?.sellingPrice ?? "0",
      barcode: variant?.barcode ?? null,
    };
  });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <PageHeader title="Products" description={`${rows.length} product${rows.length === 1 ? "" : "s"}`} icon={<PackageIcon className="h-5 w-5" />} />

      <ProductsClient products={rows} canSeeCost={canSeeCost} canManage={canManage} />
    </main>
  );
}
