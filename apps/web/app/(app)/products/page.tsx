import { listProducts } from "@erp/core/catalog";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { ImportForm } from "@/components/import-form";
import { ProductForm } from "./product-form";
import { importProductsAction } from "./actions";

export default async function ProductsPage() {
  const { tenantId, userId } = await requireSession();
  const [products, canSeeCost, canManage] = await Promise.all([
    listProducts(tenantId),
    can(userId, PERMISSIONS.PRODUCT_COST_PRICE_VIEW),
    can(userId, PERMISSIONS.PRODUCT_MANAGE),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Products</h1>

      {canManage && (
        <div className="mb-6 space-y-4">
          <ProductForm />
          <ImportForm
            action={importProductsAction}
            columnsHint="sku, name, description, baseUomCode, costPrice, sellingPrice, barcode, tracksBatches"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Barcode</th>
              {canSeeCost && <th className="px-4 py-2 text-right">Cost</th>}
              <th className="px-4 py-2 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const variant = p.variants[0];
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{p.sku}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{variant?.barcode ?? "—"}</td>
                  {canSeeCost && <td className="px-4 py-2 text-right">{variant?.costPrice ?? "0"}</td>}
                  <td className="px-4 py-2 text-right">{variant?.sellingPrice ?? "0"}</td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={canSeeCost ? 5 : 4} className="px-4 py-6 text-center text-slate-400">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
