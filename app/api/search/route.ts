import { NextRequest, NextResponse } from "next/server";

const POLYMARKET_API_URL = "https://gamma-api.polymarket.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = searchParams.get("limit") || "10";

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      q: query,
      limit_per_type: limit,
      page: "1",
      events_status: "active",
    });

    const response = await fetch(
      `${POLYMARKET_API_URL}/public-search?${params}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();

    let events: any[] = [];
    if (data?.events && Array.isArray(data.events)) {
      events = data.events;
    } else if (Array.isArray(data)) {
      events = data;
    }

    const markets = events
      .filter((e: any) => e.slug && !e.closed)
      .map((e: any) => {
        const marketData = e.markets?.[0];
        const outcomePrices = marketData?.outcomePrices
          ? JSON.parse(marketData.outcomePrices)
          : [];
        const yesPrice = parseFloat(outcomePrices[0] || "0") * 100;

        return {
          slug: e.slug,
          title: e.title || "Untitled",
          url: `https://polymarket.com/event/${e.slug}`,
          volume: typeof e.volume === "number" ? e.volume : 0,
          liquidity: typeof e.liquidity === "number" ? e.liquidity : 0,
          yesPrice,
          endDate: e.endDate || null,
          commentCount: e.commentCount || 0,
          marketCount: e.markets?.length || 0,
        };
      });

    return NextResponse.json({ markets, query });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
