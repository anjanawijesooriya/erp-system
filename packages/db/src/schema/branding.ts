import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

/**
 * One row per tenant — the printable-document customization a shop
 * controls themselves (logo, accent color, letterhead details, footer
 * note), applied by the invoice print view
 * (apps/web/app/(app)/sales/invoices/[id]/page.tsx). Deliberately not a
 * per-document-type settings table (separate invoice/quotation/etc.
 * layouts) — one consistent letterhead across every printed document,
 * which covers the actual need without the complexity of a full template
 * designer.
 */
export const documentBranding = pgTable("document_branding", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  footerNote: text("footer_note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
