import { useQuery } from "@tanstack/react-query";

export interface PopularMarket {
  slug: string;
  title: string;
  url: string;
  volume: number;
}

async function fetchPopularMarkets(): Promise<PopularMarket[]> {
  const response = await fetch("/api/popular-markets");
  if (!response.ok) {
    throw new Error("人気市場の取得に失敗しました");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export const popularMarketsQueryKey = ["popular-markets"] as const;

export function usePopularMarkets() {
  return useQuery({
    queryKey: popularMarketsQueryKey,
    queryFn: fetchPopularMarkets,
  });
}
