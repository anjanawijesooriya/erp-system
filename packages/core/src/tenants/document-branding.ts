import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@erp/db";
import { documentBranding } from "@erp/db/schema";

export const documentBrandingInput = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #4f46e5"),
  companyAddress: z.string().max(300).optional(),
  companyPhone: z.string().max(40).optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
  footerNote: z.string().max(500).optional(),
});
export type DocumentBrandingInput = z.infer<typeof documentBrandingInput>;

const DEFAULTS = {
  logoUrl: null as string | null,
  primaryColor: "#4f46e5",
  companyAddress: null as string | null,
  companyPhone: null as string | null,
  companyEmail: null as string | null,
  footerNote: null as string | null,
};

/** Always returns a row, even if the tenant has never customized anything — callers never need to null-check every field. */
export async function getDocumentBranding(tenantId: string) {
  const row = await db.query.documentBranding.findFirst({ where: eq(documentBranding.tenantId, tenantId) });
  return row ?? { tenantId, ...DEFAULTS };
}

export async function upsertDocumentBranding(tenantId: string, input: DocumentBrandingInput) {
  const [row] = await db
    .insert(documentBranding)
    .values({
      tenantId,
      logoUrl: input.logoUrl || null,
      primaryColor: input.primaryColor,
      companyAddress: input.companyAddress || null,
      companyPhone: input.companyPhone || null,
      companyEmail: input.companyEmail || null,
      footerNote: input.footerNote || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: documentBranding.tenantId,
      set: {
        logoUrl: input.logoUrl || null,
        primaryColor: input.primaryColor,
        companyAddress: input.companyAddress || null,
        companyPhone: input.companyPhone || null,
        companyEmail: input.companyEmail || null,
        footerNote: input.footerNote || null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}
