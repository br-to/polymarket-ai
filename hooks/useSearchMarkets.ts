import { useQuery } from "@tanstack/react-query";

interface SearchMarket {
  slug: string;
  title: string;
  url: string;
  volume: number;
  liquidity: number;
  yesPrice: number;
  endDate: string | null;
  commentCount: number;
  marketCount: number;
}

interface SearchResult {
  markets: SearchMarket[];
  query: string;
}

async function searchMarkets(query: string): Promise<SearchResult> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}&limit=10`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "検索に失敗しました");
  }

  return response.json();
}

export function useSearchMarkets(query: string | null) {
  return useQuery({
    queryKey: ["search-markets", query],
    queryFn: () => searchMarkets(query!),
    enabled: !!query,
  });
}
