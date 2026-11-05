import { listChannelOrders, listChannelProductLinks, listSalesChannels } from "@erp/core/ecommerce";
import { can, PERMISSIONS } from "@erp/core/rbac";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { ModuleGate } from "@/components/module-gate";
import { ChannelForm } from "./channel-form";
import { LinkProductForm } from "./link-product-form";
import { DeactivateChannelButton } from "./deactivate-button";

export default async function ChannelsPage() {
  const { tenantId, userId } = await requireSession();
  const [channels, orders, canManage] = await Promise.all([
    listSalesChannels(tenantId),
    listChannelOrders(tenantId),
    can(userId, PERMISSIONS.SALES_CHANNEL_MANAGE),
  ]);

  const linksByChannel = new Map(
    await Promise.all(channels.map(async (c) => [c.id, await listChannelProductLinks(tenantId, c.id)] as const)),
  );

  return (
    <ModuleGate tenantId={tenantId} moduleKey="ecommerce">
      <main className="mx-auto max-w-4xl p-8">
        <AppNav />
        <h1 className="mb-4 text-xl font-semibold">Sales channels</h1>

        {canManage && (
          <div className="mb-6">
            <ChannelForm />
          </div>
        )}

        <div className="space-y-4">
          {channels.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                <div className="text-sm font-medium">
                  {c.name} <span className="font-normal text-slate-400">({c.isActive ? "active" : "inactive"})</span>
                </div>
                {canManage && c.isActive && <DeactivateChannelButton channelId={c.id} />}
              </div>
              <div className="space-y-2 px-4 py-3 text-xs text-slate-600">
                <div>
                  Product feed: <code className="rounded bg-slate-100 px-1">/api/ecommerce/feed/{c.apiKey}</code>
                </div>
                <div>
                  Order webhook: <code className="rounded bg-slate-100 px-1">/api/ecommerce/webhook/{c.apiKey}</code>{" "}
                  (sign the raw body with <code className="rounded bg-slate-100 px-1">X-Webhook-Signature</code>, HMAC-SHA256
                  using the webhook secret shown only once below)
                </div>
                <div className="font-mono text-amber-700">Webhook secret: {c.webhookSecret}</div>
              </div>
              {canManage && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <LinkProductForm channelId={c.id} />
                  <ul className="mt-2 text-xs text-slate-500">
                    {(linksByChannel.get(c.id) ?? []).map((l) => (
                      <li key={l.id}>
                        {l.productVariant.sku} ↔ {l.externalSku}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {channels.length === 0 && <p className="text-sm text-slate-400">No sales channels yet.</p>}
        </div>

        <h2 className="mb-2 mt-8 text-lg font-semibold">Recent channel orders</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">External order #</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{o.channel.name}</td>
                  <td className="px-4 py-2">{o.externalOrderId}</td>
                  <td className="px-4 py-2">
                    <span className="capitalize">{o.status}</span>
                    {o.failureReason && <div className="text-xs text-red-600">{o.failureReason}</div>}
                  </td>
                  <td className="px-4 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No channel orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </ModuleGate>
  );
}
