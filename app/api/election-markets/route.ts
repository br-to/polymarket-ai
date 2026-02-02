import { NextResponse } from "next/server";
import { PolymarketAPIClient } from "@/lib/polymarket/api-client";
import { translateTitle, translateOptionName } from "@/lib/election-translate";

export async function GET() {
  try {
    const apiClient = new PolymarketAPIClient();
    const events = await apiClient.getElectionMarkets(30);

    // タイトルと選択肢名を日本語に変換して返す
    const eventsJa = events.map((event) => ({
      ...event,
      title: translateTitle(event.title),
      options: event.options?.map((opt) => ({
        ...opt,
        name: translateOptionName(opt.name),
      })),
    }));

    return NextResponse.json(eventsJa);
  } catch (error) {
    console.error("Failed to fetch election markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch election markets" },
      { status: 500 },
    );
  }
}
