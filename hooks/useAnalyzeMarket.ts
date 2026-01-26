import { useMutation } from "@tanstack/react-query";
import type { MarketAnalysis } from "@/types/market";

async function analyzeMarket(url: string): Promise<MarketAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || errorData.message || "分析に失敗しました",
    );
  }

  return response.json();
}

export function useAnalyzeMarket() {
  return useMutation({ mutationFn: analyzeMarket });
}
