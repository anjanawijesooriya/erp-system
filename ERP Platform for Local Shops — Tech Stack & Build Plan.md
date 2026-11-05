# ERP Platform for Local Shops — Tech Stack & Build Plan

Nov 4, 2026 · @Tharuka Anjana

## Overview

Build a multi-tenant, multi-purpose ERP SaaS for many shops on the stack already proven in Dukapola and eStoreMate; the new work is in accounting correctness, inventory integrity and long-running jobs. Those three areas carry most of the risk in an ERP, so this plan focuses on what must change compared with a POS.

## Recommended tech stack

Keep the core you know and add four things an ERP needs: a monorepo, a job queue, stricter tenancy and a hosting split.

| Layer | Choice | Why |
| --- | --- | --- |
| Web app | Next.js (App Router), TypeScript, Tailwind, shadcn/ui | Existing stack, fastest to ship |
| Database | PostgreSQL with Prisma or Drizzle | Drizzle suits complex reporting SQL and transactions; Prisma is fine if faster for you |
| Auth | NextAuth + custom RBAC | Per-tenant, per-branch permissions (e.g. cashier can't see cost price; only accountant posts journals) |
| Code structure | Turborepo: `apps/web`, `apps/worker`, `packages/db`, `packages/core`, `packages/ui` | Business rules live in `core`, reused by web and worker |
| Background jobs | BullMQ + Redis | Payroll, month-end close, large reports, Excel imports and backups exceed Vercel serverless timeouts |
| Hosting | Frontend on Vercel; worker + Postgres on Railway, Render or a VPS | Business-critical data needs real backups and point-in-time recovery; avoid Supabase free tier here |
| Tenancy safety | Postgres Row-Level Security on top of `shopId` scoping | One missed `where` clause on financial data is a serious incident |
| Offline POS | PWA with IndexedDB (Dexie) and a sync queue | Back-office modules can stay online-only |
| Reports and printing | react-pdf or Puppeteer (in worker), ExcelJS, ESC/POS | PDFs, Excel exports, thermal printers |
| Observability | Sentry + structured logs | Catch errors in production |
| Testing | Vitest for accounting and inventory logic; Playwright for key flows | Accounting tests are non-negotiable |

## Design rules to decide on day one

These seven rules are cheap to adopt at the start and very expensive to retrofit.

1. **Double-entry ledger is the source of truth.** Every sale, purchase, payment and stock adjustment posts journal entries automatically; P&L, balance sheet, receivables and payables are derived from them.
2. **Stock is a ledger of movements.** No editable `quantity` field: every GRN, sale, return, transfer and adjustment is a movement row, and stock on hand is their sum. Start with weighted-average costing.
3. **Posted documents are never deleted.** Void or reverse them with an opposite entry, and keep a full audit log of who changed what and when.
4. **Money is `Decimal`, never float.** Extend the snapshot pricing already used on sale lines to tax and cost.
5. **Document numbers are gapless per tenant, branch and type** (e.g. INV-COL-000123). Auditors check this.
6. **Taxes and payroll are configuration, not code.** VAT, SSCL, EPF/ETF and APIT rates change, so store them as dated settings.
7. **Multi-branch and multi-warehouse are in the schema from the start.**

## SaaS and multi-tenancy

The platform is one multi-tenant SaaS serving many independent businesses of different types, from a single corner shop to a multi-branch chain, each seeing only its own data. POS is one module, so a shop can use it as a simple POS or a full ERP.

**Tenant structure.** A tenant is a business, not a shop: Tenant → Branches (shops) → Warehouses / POS registers → Users. Every table carries `tenantId`; branch-level records also carry `branchId`. A single shop is a tenant with one branch, so no special-case code is needed.

**Data isolation.** Shared database, `tenantId` on every row, enforced by Postgres Row-Level Security so a missed filter can never leak another shop's data.

**Multi-purpose by configuration, not custom code.** Each tenant picks a business type at signup, which loads defaults:

| Business type | Defaults switched on |
| --- | --- |
| Grocery / retail | Barcodes, fast POS, weighed items |
| Pharmacy | Batch and expiry tracking, supplier credit |
| Hardware | Units of measure (box ↔ piece), credit customers, quotations |
| Textile / apparel | Size and colour variants |
| Wholesale / distribution | Price levels, sales orders, delivery, PDC cheques |

Tenants also set their own tax registration, document number prefixes, receipt layout and logo, language (Sinhala, Tamil, English), and users and roles per branch.

**Plans and feature flags.** One platform, tiers switched on by plan; upgrading needs no migration. Billing through PayHere.

| Plan | Modules |
| --- | --- |
| POS | Sales, basic stock, daily reports |
| Business | + Purchasing, credit customers and suppliers, multi-branch |
| ERP | + Full accounting, cheques and PDC, payroll, advanced reports |

**Access.** Each business gets its own subdomain (`shopname.yourerp.lk`) via Cloudflare and Vercel wildcard routing; offline-capable POS registers sync to their tenant.

**Operational SaaS needs**

- Self-service signup with onboarding wizard and Excel import
- Super-admin panel: tenants, plans, usage, support impersonation with audit log
- Per-tenant data export
- Plan limits on branches, users and products

## Development phases

Phases 0–6 make a sellable MVP for one niche; 7–9 harden, prove and expand it.

1. **Phase 0 – Discovery (2–3 weeks)**
   - Visit 10–15 shops and pick one or two niches first (hardware, pharmacy, grocery wholesale, textiles); a generic ERP is hard to sell.
   - Map real workflows: credit customers, post-dated cheques, supplier credit, side Excel books.
   - Define MVP modules; defer HR and payroll.
2. **Phase 1 – Foundation**
   - Monorepo, auth, tenants, branches, users, RBAC permission matrix, audit log.
   - PayHere subscription billing and a tenant onboarding wizard.
3. **Phase 2 – Master data**
   - Products, variants, units of measure with conversions (box ↔ piece), barcodes.
   - Customers and suppliers with credit limits and terms.
   - Default chart-of-accounts template per business type.
   - Excel import for all of the above.
4. **Phase 3 – Inventory**
   - Warehouses, stock movements, branch transfers, adjustments, stock counts.
   - Batch and expiry tracking, reorder levels, low-stock alerts.
5. **Phase 4 – Purchasing**
   - Purchase order → GRN → supplier invoice → supplier payment.
   - Purchase returns and payables aging.
6. **Phase 5 – Sales**
   - Quotation → sales order → invoice → delivery → payment.
   - Credit sales, returns and credit notes, receivables aging.
   - POS module reusing Dukapola and eStoreMate work.
7. **Phase 6 – Accounting**
   - Automatic posting from every module, plus manual journals.
   - Cash and bank books, cheque management with PDC tracking, bank reconciliation.
   - Trial balance, P&L, balance sheet, period locking.
8. **Phase 7 – Reports and dashboards**
   - Sales, margin, stock valuation, dead stock, top customers and products.
   - Daily owner SMS summaries via Notify.lk.
9. **Phase 8 – Pilot**
   - Run 3–5 shops in parallel with their old system for a month; reconcile weekly.
   - Fix issues, launch, and plan for in-person onboarding.
10. **Phase 9 – Expansion**
    - HR and payroll (EPF/ETF/APIT), manufacturing or BOM for niches that need it, e-commerce sync, accountant portal with multi-company access.

## Timeline and open decision

A solo build reaches a sellable MVP (Phases 1–6, one niche) in about 4–6 months.

One option is to build the ERP as a tier on top of Dukapola, sharing tenancy, auth, products and POS. Existing shops could then upgrade without migrating.

- [ ] Decide: ERP tier on Dukapola, or a fully separate product?
