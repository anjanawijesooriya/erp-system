"use client";

import { useActionState, useState } from "react";
import { Button } from "@erp/ui/button";
import { Input, Label } from "@erp/ui/input";
import { saveDocumentBrandingAction } from "./actions";

interface Branding {
  logoUrl: string | null;
  primaryColor: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  footerNote: string | null;
}

export function BrandingForm({ branding, tenantName }: { branding: Branding; tenantName: string }) {
  const [state, formAction, pending] = useActionState(saveDocumentBrandingAction, undefined);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl ?? "");
  const [color, setColor] = useState(branding.primaryColor);
  const [address, setAddress] = useState(branding.companyAddress ?? "");
  const [phone, setPhone] = useState(branding.companyPhone ?? "");
  const [email, setEmail] = useState(branding.companyEmail ?? "");
  const [footer, setFooter] = useState(branding.footerNote ?? "");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" name="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          <p className="mt-1 text-xs text-slate-400">A hosted image URL — there's no file upload yet, so host it somewhere first.</p>
        </div>
        <div>
          <Label htmlFor="primaryColor">Accent color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
            />
            <Input
              id="primaryColor"
              name="primaryColor"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              pattern="^#[0-9a-fA-F]{6}$"
              required
              className="flex-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="companyPhone">Phone</Label>
            <Input id="companyPhone" name="companyPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="companyEmail">Email</Label>
            <Input id="companyEmail" name="companyEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="companyAddress">Address</Label>
          <Input id="companyAddress" name="companyAddress" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="footerNote">Footer note</Label>
          <textarea
            id="footerNote"
            name="footerNote"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            rows={3}
            placeholder="e.g. Thank you for your business. Goods once sold are not returnable."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        {state?.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save branding"}
        </Button>
      </form>

      {/* Live preview */}
      <div className="lg:col-span-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between p-5" style={{ borderBottom: `3px solid ${color}` }}>
            <div>
              <p className="text-base font-semibold text-slate-900">{tenantName}</p>
              {address && <p className="text-xs text-slate-500">{address}</p>}
              {(phone || email) && (
                <p className="text-xs text-slate-500">
                  {phone}
                  {phone && email ? " · " : ""}
                  {email}
                </p>
              )}
            </div>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: color }}>
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="p-5">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color }}>
              Invoice
            </p>
            <div className="mt-3 h-px w-full bg-slate-100" />
            <p className="mt-3 text-xs text-slate-400">Line items would appear here...</p>
          </div>
          {footer && <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
