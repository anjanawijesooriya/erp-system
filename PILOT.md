# Phase 8 — Pilot Plan

Per the build plan: run 3–5 shops in parallel with their old system for about a
month, reconcile weekly, fix issues, then launch and plan in-person onboarding.
This doc is the checklist for running that — not code, a process.

## 1. Shop selection

- Pick shops from the niche(s) chosen in Phase 0 (hardware, pharmacy, grocery
  wholesale, textile — whatever you picked after the discovery visits).
- 3–5 shops. Fewer than 3 and a quirk looks like a pattern; more than 5 and you
  can't give each one proper attention during a solo pilot.
- Prefer a mix: at least one single-branch shop and one multi-branch shop if
  you have access to both, so both paths get exercised.
- Confirm each shop is willing to run **in parallel** with their existing
  system (manual books / old software) for the full pilot window — don't cut
  them over cold. The weekly reconciliation in step 3 depends on this.

## 2. Go-live data import (per shop)

Use `/pilot/opening-balances` (requires the `pilot.opening_balance.import`
permission — Owner and Accountant have it by default).

1. **Master data first**, via the existing Phase 2 Excel import
   (`/products`, `/customers`, `/suppliers`) — SKUs, prices, customer/supplier
   credit terms. Get this right before touching balances; opening stock and
   AR/AP imports reference these records by SKU/code/name.
2. **Opening stock**: one row per (warehouse, SKU) with quantity and unit
   cost, as of the go-live date. This posts through the normal stock ledger
   (`postMovement`, `movementType: "opening_balance"`) — it's a real, audited
   movement, not a backdoor edit to a balance.
3. **Opening customer balances (receivables)** and **opening supplier
   balances (payables)**: one row per customer/supplier with their
   outstanding amount as of go-live. These become real, agable invoices (they
   show up correctly in `/sales/receivables` and `/purchasing/payables`), not
   just a GL number — the shop's existing debtors/creditors aren't lost.
4. Each import's accounting entry lands in **Opening Balance Equity (3800)**,
   never Sales Revenue or COGS — check `/accounting/journal` afterward and
   confirm the entries say `opening_balance`, not `sales_invoice` or
   `grn`.
5. Sanity check before moving on: `/reports` → stock valuation total should
   roughly match what the shop believes their stock is worth; receivables
   and payables totals should match the shop's own figures (if they don't,
   fix the import now, before day-to-day transactions start layering on top).

## 3. Weekly reconciliation

Use `/pilot/reconciliation` (requires `pilot.reconciliation.manage` — Owner
and Accountant by default).

Every week, for each pilot shop, for each of the three days you check:

1. Ask the shop (or read their old system) for that day's **sales total**,
   **cash in hand**, and (less often — maybe twice during the pilot, not
   weekly) a **manual stock count value**.
2. Enter each as a reconciliation entry. The system figure is computed live
   from the ledger, so there's nothing to "sync" — just enter the manual
   number and read the variance column.
3. **Variance under ~1%**: fine, ledger is doing its job.
4. **Variance over that**: don't just note it and move on — find the actual
   cause before the next week compounds it:
   - Missing document (a sale or purchase that happened but wasn't entered)
   - Duplicate document (entered twice)
   - Wrong price/cost on a line
   - A payment applied to the wrong invoice
   - (For stock) a movement that bypassed the system — physical stock moved
     without a corresponding adjustment/transfer/count being posted
5. Log anything you had to chase down as an issue (step 4) even after you've
   fixed it — the point of the pilot is to find the *pattern* of what goes
   wrong, not just fix each instance.

## 4. Issue tracking

Use `/pilot/issues` — anyone logged in at a pilot shop can report an issue
(including Cashiers); Owners/Accountants/BranchManagers can triage and close
them. You also get a cross-tenant view at `/admin` (platform admin login) to
see every pilot shop's issues in one place.

- Log **everything** that confuses a user during the pilot, not just bugs —
  "the cashier didn't know where to find X" is as important as a crash, since
  it tells you what the in-person onboarding script (step 6) needs to cover.
- Severity guide: **critical** = blocks a sale/purchase from being recorded
  at all; **high** = wrong numbers (a miscalculated total, a report that
  doesn't match reality); **medium** = works but confusing/slow; **low** =
  cosmetic.
- Triage weekly alongside the reconciliation — a pattern of "medium" issues
  in the same screen is often worth fixing before the next shop onboards,
  even if no single instance seemed urgent.

## 5. "Ready to launch" criteria

Don't call the pilot done just because the month elapsed. Check:

- [ ] Every pilot shop's weekly variance has been under ~1% for at least the
      last two weeks running (not just the most recent week — one good week
      after a bad one isn't a trend yet)
- [ ] No open **critical** or **high** issues across any pilot shop
- [ ] Each pilot shop's owner has actually looked at `/reports` and confirmed
      it matches their own sense of how the shop is doing (margin, top
      products) — a system that's numerically correct but that the owner
      doesn't trust hasn't actually proven itself yet
- [ ] You've personally walked through a full day's worth of each shop's
      real workflow (not a demo workflow) at least once without needing to
      intervene
- [ ] The in-person onboarding script (step 6) has been dry-run on at least
      one of the pilot shops, not just written

## 6. In-person onboarding (for shops after the pilot)

Write this as you go through the pilot, not from scratch afterward — every
time you have to explain something to a pilot shop in person, that's a line
for this script.

Minimum sections to end up with:
1. Login (shop slug + email + password) and what each role sees
2. The one or two screens the shop will use almost every day (for most
   retail shops: POS / sales invoice + stock view)
3. How to do the thing they're most likely to get wrong first (per the
   issues you logged in step 4 — this list IS your early-warning system for
   what training needs to cover)
4. Who to call/message when something looks wrong, and what information to
   have ready (which usually means: screenshot + what they were trying to do
   + the exact error if there is one)

## Known system limitations to set expectations about before a pilot shop goes live

(Carried over from what's documented in `README.md` — repeated here because
these are the ones a pilot shop owner should specifically be told about
rather than discover on their own.)

- Purchase/sales **returns don't automatically net against** the
  payables/receivables aging report — a return is its own document.
- Payment **overpayments** beyond total outstanding aren't tracked as a
  credit balance — they're simply not allocated anywhere.
- The super-admin "view tenant" action is an audit log entry, not true
  impersonation — if you (running the pilot) need to see exactly what a
  shop's screen looks like, log in with their actual credentials, don't rely
  on the admin panel for that yet.
- The daily SMS summary needs real Notify.lk credentials configured on the
  worker — confirm with each pilot shop whether they want this enabled
  before assuming it's sending.
