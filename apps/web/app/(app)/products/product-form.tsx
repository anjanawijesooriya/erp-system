"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@erp/ui/button";
import { Label } from "@erp/ui/input";
import { FormBody, FormFooter, FormSectionLabel } from "@erp/ui/form";
import { useToast } from "@erp/ui/toast";
import { PlusIcon } from "@/components/icons";
import { createProductAction, updateProductAction } from "./actions";
import type { ProductRow } from "./products-client";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function ProductForm({
  mode,
  product,
  onDone,
}: {
  mode: "create" | "edit";
  product?: ProductRow;
  onDone: () => void;
}) {
  const action = mode === "edit" ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const toast = useToast();
  const wasPending = useRef(false);

  const [costPrice, setCostPrice] = useState(product?.costPrice ?? "0");
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ?? "0");

  const cost = Number(costPrice) || 0;
  const price = Number(sellingPrice) || 0;
  const margin = cost > 0 && price > 0 ? ((price - cost) / price) * 100 : null;

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;

    if (state?.error) {
      toast(state.error, "error");
    } else {
      toast(mode === "edit" ? "Product updated." : "Product added.", "success");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      {mode === "edit" && product && <input type="hidden" name="productId" value={product.id} />}
      <FormBody>
      <div className="col-span-2">
        <Label>Product name</Label>
        <input name="name" required defaultValue={product?.name} className={inputClass} />
      </div>
      <div>
        <Label>SKU / code</Label>
        {mode === "edit" ? (
          <input value={product?.sku} disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
        ) : (
          <input name="sku" required placeholder="PROD-0001" className={inputClass} />
        )}
      </div>

      {mode === "create" && (
        <div>
          <Label>Base unit code</Label>
          <input name="baseUomCode" required placeholder="PCS" className={inputClass} />
        </div>
      )}
      <div className="col-span-2">
        <Label>Barcode (optional)</Label>
        <input name="barcode" defaultValue={product?.barcode ?? ""} className={inputClass} />
      </div>

      <FormSectionLabel>Pricing</FormSectionLabel>
      <div>
        <Label>Cost price</Label>
        <input
          name="costPrice"
          type="number"
          step="0.01"
          min="0"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <Label>Selling price</Label>
        <input
          name="sellingPrice"
          type="number"
          step="0.01"
          min="0"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <Label>Margin</Label>
        <input
          disabled
          value={margin === null ? "—" : `${margin.toFixed(1)}%`}
          className={`${inputClass} bg-slate-50 font-semibold text-success-700`}
        />
      </div>

      <FormSectionLabel>Inventory tracking</FormSectionLabel>
      <div className="col-span-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="tracksBatches"
            value="true"
            defaultChecked={product?.tracksBatches ?? false}
            className="h-4 w-4 accent-brand-700"
          />
          Track batch number &amp; expiry for this item
        </label>
      </div>

      {mode === "edit" && (
        <div className="col-span-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={product?.isActive ?? true}
              className="h-4 w-4 accent-brand-700"
            />
            Active (visible for sale and purchasing)
          </label>
        </div>
      )}

      <div className="col-span-3">
        <Label>Description (optional)</Label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className={`${inputClass} resize-none py-2.5`}
          placeholder="Internal notes or customer-facing description…"
        />
      </div>
      </FormBody>
      <FormFooter>
        <Button type="submit" disabled={pending} className="gap-1.5">
          <PlusIcon className="h-4 w-4" />
          {pending ? "Saving..." : mode === "edit" ? "Save product" : "Add product"}
        </Button>
      </FormFooter>
    </form>
  );
}
