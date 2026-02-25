import { useQuery } from "@tanstack/react-query";

interface PricePoint {
  t: number;
  p: number;
}

interface OrderBookEntry {
  price: string;
  size: string;
}

interface MarketDetailData {
  tokens: Array<{ question: string; tokenId: string; outcome: string }>;
  priceHistory: PricePoint[];
  orderBook: {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    lastTradePrice: string;
  };
}

async function fetchMarketDetail(url: string): Promise<MarketDetailData> {
  const response = await fetch(
    `/api/market-detail?url=${encodeURIComponent(url)}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch market details");
  }

  return response.json();
}

export function useMarketDetail(url: string | null) {
  return useQuery({
    queryKey: ["market-detail", url],
    queryFn: () => fetchMarketDetail(url!),
    enabled: !!url,
  });
}
