import { eq } from "drizzle-orm";
import { db } from "@erp/db";
import { tenants } from "@erp/db/schema";
import { getDocumentBranding } from "@erp/core/tenants";
import { requireSession } from "@/lib/session";
import { BrandingForm } from "./branding-form";

export default async function InvoiceBrandingPage() {
  const { tenantId } = await requireSession();
  const [branding, tenant] = await Promise.all([
    getDocumentBranding(tenantId),
    db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) }),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invoice branding</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your logo, accent color, and letterhead details — applied to every printed sales invoice.
      </p>

      <div className="mt-6">
        <BrandingForm branding={branding} tenantName={tenant?.name ?? "Your shop"} />
      </div>
    </main>
  );
}
