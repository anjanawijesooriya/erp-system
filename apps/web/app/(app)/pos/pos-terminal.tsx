"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@erp/ui/button";
import { Select } from "@erp/ui/input";
import { checkoutPosSaleAction, closeRegisterAction } from "./actions";
import { OpenRegisterForm } from "./open-register-form";
import { RegisterStatusBar } from "./register-status-bar";
import type { PosVariantOption } from "@/lib/pos-options";

interface CartLine {
  productVariantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

const CARD_COLORS = [
  "bg-brand-50 text-brand-700",
  "bg-accent-50 text-accent-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-violet-50 text-violet-700",
  "bg-cyan-50 text-cyan-700",
  "bg-orange-50 text-orange-700",
];

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CARD_COLORS[hash % CARD_COLORS.length];
}

export function PosTerminal({
  branches,
  warehouses,
  customers,
  variants,
  openSession,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: PosVariantOption[];
  openSession: { id: string; openingBalance: string; openedAt: string; openedByName: string } | null;
}) {
  const [branchId] = useState(branches[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [receipt, setReceipt] = useState<{ docNumber: string; total: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [closeSummary, setCloseSummary] = useState<{ expected: string; counted: string; variance: string } | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closePending, startCloseTransition] = useTransition();

  function closeRegister(formData: FormData) {
    setCloseError(null);
    startCloseTransition(async () => {
      const result = await closeRegisterAction(undefined, formData);
      if (result.error) {
        setCloseError(result.error);
        return;
      }
      if (result.expected !== undefined && result.counted !== undefined && result.variance !== undefined) {
        setCloseSummary({ expected: result.expected, counted: result.counted, variance: result.variance });
      }
    });
  }

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) => v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));
  }, [search, variants]);

  const total = useMemo(() => cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, l) => sum + l.quantity, 0), [cart]);

  function addToCart(variant: PosVariantOption) {
    setReceipt(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.productVariantId === variant.id);
      if (existing) {
        return prev.map((l) => (l.productVariantId === variant.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        { productVariantId: variant.id, name: variant.name, sku: variant.sku, quantity: 1, unitPrice: Number(variant.sellingPrice) },
      ];
    });
  }

  function setQuantity(productVariantId: string, quantity: number) {
    if (quantity <= 0) {
      removeLine(productVariantId);
      return;
    }
    setCart((prev) => prev.map((l) => (l.productVariantId === productVariantId ? { ...l, quantity } : l)));
  }

  function removeLine(productVariantId: string) {
    setCart((prev) => prev.filter((l) => l.productVariantId !== productVariantId));
  }

  function checkout() {
    if (cart.length === 0) return;
    setError(null);
    setReceipt(null);

    const formData = new FormData();
    formData.set("branchId", branchId);
    formData.set("warehouseId", warehouseId);
    if (customerId) formData.set("customerId", customerId);
    formData.set("method", method);
    formData.set(
      "lines",
      JSON.stringify(cart.map((l) => ({ productVariantId: l.productVariantId, quantity: l.quantity, unitPrice: l.unitPrice }))),
    );

    startTransition(async () => {
      const result = await checkoutPosSaleAction(undefined, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReceipt({ docNumber: result.docNumber ?? "", total: result.total ?? "" });
      setCart([]);
    });
  }

  const varianceBanner = closeSummary && (
    <div
      className={`mb-4 rounded-xl border p-3 text-sm ${
        Number(closeSummary.variance) === 0
          ? "border-accent-200 bg-accent-50 text-accent-800"
          : Number(closeSummary.variance) > 0
            ? "border-sky-200 bg-sky-50 text-sky-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      <p className="font-medium">Register closed.</p>
      <p className="mt-0.5">
        Expected {Number(closeSummary.expected).toLocaleString()} · Counted {Number(closeSummary.counted).toLocaleString()} ·{" "}
        {Number(closeSummary.variance) === 0
          ? "Exact match, no variance."
          : Number(closeSummary.variance) > 0
            ? `Over by ${Number(closeSummary.variance).toLocaleString()}.`
            : `Short by ${Math.abs(Number(closeSummary.variance)).toLocaleString()}.`}
      </p>
    </div>
  );

  if (!openSession) {
    return (
      <div>
        {varianceBanner}
        <OpenRegisterForm branchId={branchId} />
      </div>
    );
  }

  return (
    <div>
      {varianceBanner}
      <RegisterStatusBar
        branchId={branchId}
        openingBalance={openSession.openingBalance}
        openedAt={openSession.openedAt}
        openedByName={openSession.openedByName}
        pending={closePending}
        error={closeError}
        onClose={closeRegister}
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* Product grid */}
      <div className="lg:col-span-3">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="relative flex-1 min-w-[180px]">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="9" cy="9" r="6" />
              <path d="m17 17-4-4" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-auto">
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filteredVariants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => addToCart(v)}
              className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${colorFor(v.id)}`}>
                {v.name.charAt(0).toUpperCase()}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-900">{v.name}</p>
              <p className="text-xs text-slate-400">{v.sku}</p>
              <p className="mt-1 text-sm font-semibold text-brand-700">{Number(v.sellingPrice).toLocaleString()}</p>
            </button>
          ))}
          {filteredVariants.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-slate-400">No products match &quot;{search}&quot;.</p>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2">
        <div className="sticky top-20 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-100 p-4">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                    <circle cx="9" cy="20" r="1.4" />
                    <circle cx="17" cy="20" r="1.4" />
                    <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L19.5 7h-15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">Cart is empty</p>
                <p className="text-xs text-slate-400">Click a product to add it</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map((l) => (
                  <li key={l.productVariantId} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-400">{l.unitPrice.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setQuantity(l.productVariantId, l.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{l.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(l.productVariantId, l.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-20 shrink-0 text-right text-sm font-semibold text-slate-900">
                      {(l.quantity * l.unitPrice).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-500">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
              <span className="text-2xl font-semibold text-slate-900">{total.toLocaleString()}</span>
            </div>
            <Select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="cheque">Cheque</option>
            </Select>
            <Button type="button" onClick={checkout} disabled={pending || cart.length === 0} size="lg" className="w-full">
              {pending ? "Processing..." : "Complete sale"}
            </Button>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {receipt && (
              <p className="rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-sm text-accent-700">
                Sale {receipt.docNumber} completed — {receipt.total}
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
