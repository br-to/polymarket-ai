import { NextRequest, NextResponse } from "next/server";
import { PolymarketAPIClient } from "@/lib/polymarket/api-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url || !url.includes("polymarket.com")) {
      return NextResponse.json(
        { error: "Valid Polymarket URL is required" },
        { status: 400 }
      );
    }

    const apiClient = new PolymarketAPIClient();

    // Get token IDs for the event's markets
    const tokens = await apiClient.getClobTokenIds(url);
    if (tokens.length === 0) {
      return NextResponse.json(
        { error: "No markets found for this event" },
        { status: 404 }
      );
    }

    // Fetch price history and order book for the first (or primary) market
    const primaryToken = tokens[0];
    const [priceHistory, orderBook] = await Promise.all([
      apiClient.getPriceHistory(primaryToken.tokenId, "max"),
      apiClient.getOrderBook(primaryToken.tokenId),
    ]);

    return NextResponse.json({
      tokens,
      priceHistory,
      orderBook,
    });
  } catch (error) {
    console.error("Market detail error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch market details",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
