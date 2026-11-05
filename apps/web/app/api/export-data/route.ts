import { NextResponse } from "next/server";
import { exportTenantData } from "@erp/core/tenants";
import { assertCan, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";

export async function GET() {
  const { tenantId, userId } = await requireSession();
  await assertCan(userId, PERMISSIONS.TENANT_SETTINGS_MANAGE);

  const data = await exportTenantData(tenantId);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="export-${data.tenant.slug}-${data.exportedAt.slice(0, 10)}.json"`,
    },
  });
}
