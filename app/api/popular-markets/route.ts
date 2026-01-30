import { NextResponse } from "next/server";
import { PolymarketAPIClient } from "@/lib/polymarket/api-client";

export async function GET() {
  try {
    const apiClient = new PolymarketAPIClient();
    const events = await apiClient.getPopularEvents(5);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch popular markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch popular markets" },
      { status: 500 },
    );
  }
}
