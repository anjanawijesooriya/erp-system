import { NextResponse } from "next/server";
import { getChannelProductFeed } from "@erp/core/ecommerce";

/** Public product/price/stock feed a storefront polls, authenticated by apiKey in the path — see the webhook route for why there's no session here. */
export async function GET(_request: Request, { params }: { params: Promise<{ apiKey: string }> }) {
  const { apiKey } = await params;
  const feed = await getChannelProductFeed(apiKey);
  if (!feed) {
    return NextResponse.json({ error: "Unknown or inactive channel" }, { status: 404 });
  }
  return NextResponse.json({ products: feed });
}
