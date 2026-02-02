import { useQuery } from "@tanstack/react-query";

export interface ElectionMarket {
  slug: string;
  title: string;
  url: string;
  volume: number;
  options?: Array<{ name: string; price: number }>;
}

async function fetchElectionMarkets(): Promise<ElectionMarket[]> {
  const response = await fetch("/api/election-markets");
  if (!response.ok) {
    throw new Error("選挙市場の取得に失敗しました");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export const electionMarketsQueryKey = ["election-markets"] as const;

export function useElectionMarkets() {
  return useQuery({
    queryKey: electionMarketsQueryKey,
    queryFn: fetchElectionMarkets,
    refetchInterval: 60000, // Refetch every minute
  });
}
