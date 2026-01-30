import { NextRequest, NextResponse } from "next/server";
import { PolymarketAPIClient } from "@/lib/polymarket/api-client";
import { CommentFetcher } from "@/lib/polymarket/comment-fetcher";
import { HolderFetcher } from "@/lib/polymarket/holder-fetcher";
import { MarketAnalyzer } from "@/lib/ai/analyzer";
import type { MarketAnalysis, MarketOption } from "@/types/market";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate Polymarket URL
    if (!url.includes("polymarket.com")) {
      return NextResponse.json(
        { error: "Invalid Polymarket URL" },
        { status: 400 },
      );
    }

    const apiClient = new PolymarketAPIClient();

    // Fetch market info
    const marketInfo = await apiClient.getMarketInfo(url);
    if (!marketInfo) {
      return NextResponse.json(
        { error: "Failed to fetch market information" },
        { status: 500 },
      );
    }

    // Fetch market options
    const marketOptions: MarketOption[] = await apiClient.getMarketOptions(url);

    // Fetch comments
    const commentFetcher = new CommentFetcher();
    const comments = await commentFetcher.fetchComments(url);

    // Fetch top holders
    const holderFetcher = new HolderFetcher();
    const topHolders = await holderFetcher.fetchTopHolders(url);

    // Determine current situation
    const dominantOption = marketOptions.find((opt) => opt.price > 50);
    const isOneSided = dominantOption && dominantOption.price > 80;
    const priceChange: "急変" | "1強" | "均衡" = isOneSided
      ? "1強"
      : marketOptions.some((opt) => opt.price > 60)
        ? "急変"
        : "均衡";

    // Analyze with AI
    const analyzer = new MarketAnalyzer();
    const analysis = await analyzer.analyzeMarket(
      marketInfo.title,
      marketOptions,
      comments,
      topHolders,
      marketInfo.description,
    );

    // Build final response
    const result: MarketAnalysis = {
      marketUrl: url,
      marketTitle: marketInfo.title,
      marketDescription: marketInfo.description,
      marketDescriptionSummary: analysis.marketDescriptionSummary,
      currentSituation: {
        priceChange,
        dominantOption: dominantOption
          ? `${dominantOption.name} ${dominantOption.price.toFixed(1)}%`
          : undefined,
        timestamp: new Date().toISOString(),
      },
      marketOptions,
      reasons: analysis.reasons,
      whaleOpinions: analysis.whaleOpinions,
      opposingViews: analysis.opposingViews,
      triggers: analysis.triggers,
      metadata: {
        analyzedAt: new Date().toISOString(),
        commentCount: comments.length,
        whaleCount: topHolders.length,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
