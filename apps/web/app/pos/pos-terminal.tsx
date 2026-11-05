"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@erp/ui/button";
import { checkoutPosSaleAction } from "./actions";
import type { PosVariantOption } from "@/lib/pos-options";

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

interface CartLine {
  productVariantId: string;
  label: string;
  quantity: number;
  unitPrice: number;
}

export function PosTerminal({
  branches,
  warehouses,
  customers,
  variants,
}: {
  branches: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  customers: { id: string; label: string }[];
  variants: PosVariantOption[];
}) {
  const [branchId] = useState(branches[0]?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState<"cash" | "bank" | "cheque">("cash");
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [receipt, setReceipt] = useState<{ docNumber: string; total: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = useMemo(() => cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0), [cart]);

  function addToCart() {
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((l) => l.productVariantId === variant.id);
      if (existing) {
        return prev.map((l) =>
          l.productVariantId === variant.id ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [
        ...prev,
        {
          productVariantId: variant.id,
          label: variant.label,
          quantity,
          unitPrice: Number(variant.sellingPrice),
        },
      ];
    });
    setQty("1");
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

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Warehouse</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Customer (optional — walk-in)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass}>
              <option value="">Walk-in</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Product</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className={inputClass}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.sellingPrice})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Quantity</label>
            <input
              type="number"
              step="0.01"
              min="0.0001"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={addToCart} className="w-full">
              Add to cart
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Line total</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {cart.map((l) => (
                <tr key={l.productVariantId} className="border-t border-slate-100">
                  <td className="px-4 py-2">{l.label}</td>
                  <td className="px-4 py-2 text-right">{l.quantity}</td>
                  <td className="px-4 py-2 text-right">{l.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{(l.quantity * l.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(l.productVariantId)}
                      className="text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Cart is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-2xl font-semibold">{total.toFixed(2)}</span>
          </div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Payment method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className={`${inputClass} mb-3`}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
          </select>
          <Button type="button" onClick={checkout} disabled={pending || cart.length === 0} className="w-full">
            {pending ? "Processing..." : "Checkout"}
          </Button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {receipt && (
            <p className="mt-2 text-sm text-green-700">
              Sale {receipt.docNumber} completed — {receipt.total}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
