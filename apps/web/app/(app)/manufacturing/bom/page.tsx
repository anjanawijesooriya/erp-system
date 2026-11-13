import { listBoms } from "@erp/core/manufacturing";
import { listProducts } from "@erp/core/catalog";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { PageHeader } from "@erp/ui/card";
import { requireSession } from "@/lib/session";
import { ModuleGate } from "@/components/module-gate";
import { PackageIcon } from "@/components/icons";
import { BomClient } from "./bom-client";

export default async function BomPage() {
  const { tenantId, userId } = await requireSession();
  const [boms, products, canManage] = await Promise.all([
    listBoms(tenantId),
    listProducts(tenantId),
    can(userId, PERMISSIONS.BOM_MANAGE),
  ]);

  const variantOptions = products.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      label: `${v.sku} — ${p.name}${v.name !== "Default" ? ` (${v.name})` : ""}`,
      costPrice: Number(v.costPrice),
    })),
  );

  const rows = boms.map((b) => {
    const lines = b.lines.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      unitCost: Number(l.componentVariant.costPrice),
      componentName: l.componentVariant.name,
      componentSku: l.componentVariant.sku,
    }));
    return {
      id: b.id,
      name: b.name,
      outputVariantName: `${b.outputVariant.sku} — ${b.outputVariant.name}`,
      outputQuantity: b.outputQuantity,
      costPerUnit: lines.reduce((sum, l) => sum + l.unitCost * Number(l.quantity), 0) / Number(b.outputQuantity),
      lines,
    };
  });

  return (
    <ModuleGate tenantId={tenantId} moduleKey="manufacturing">
      <main className="mx-auto max-w-5xl p-8">
        <PageHeader
          title="Bills of materials"
          description="The recipe for each manufactured product — components and quantities required."
          icon={<PackageIcon className="h-5 w-5" />}
        />

        <BomClient boms={rows} variants={variantOptions} canManage={canManage} />
      </main>
    </ModuleGate>
  );
}
