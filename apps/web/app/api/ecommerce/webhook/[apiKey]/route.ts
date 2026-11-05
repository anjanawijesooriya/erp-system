import { NextResponse } from "next/server";
import { findChannelByApiKey, importChannelOrder, verifyWebhookSignature } from "@erp/core/ecommerce";

/**
 * Public, unauthenticated-by-session endpoint — a storefront posts here
 * directly, identified by `apiKey` in the path and authenticated by an
 * HMAC signature (`X-Webhook-Signature`, hex-encoded SHA-256 of the raw
 * body with the channel's `webhookSecret`), the same model webhook
 * providers like Stripe use. There is deliberately no tenant session
 * here — the storefront isn't a logged-in user.
 */
export async function POST(request: Request, { params }: { params: Promise<{ apiKey: string }> }) {
  const { apiKey } = await params;
  const channel = await findChannelByApiKey(apiKey);
  if (!channel || !channel.isActive) {
    return NextResponse.json({ error: "Unknown or inactive channel" }, { status: 404 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature, channel.webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await importChannelOrder(channel.id, payload);
  if (!result) {
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
  if (result.status === "failed") {
    return NextResponse.json({ status: result.status, failureReason: result.failureReason }, { status: 422 });
  }
  return NextResponse.json({ status: result.status, channelOrderId: result.id });
}
