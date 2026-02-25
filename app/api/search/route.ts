import { NextRequest, NextResponse } from "next/server";
import { PolymarketAPIClient } from "@/lib/polymarket/api-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Number(searchParams.get("limit") || "10");

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const apiClient = new PolymarketAPIClient();
    const markets = await apiClient.searchMarkets(query, limit);

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
