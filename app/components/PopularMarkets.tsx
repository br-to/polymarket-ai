"use client";

import { usePopularMarkets } from "@/hooks/usePopularMarkets";

interface PopularMarketsProps {
  onSelect: (url: string) => void;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(1)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

export function PopularMarkets({ onSelect }: PopularMarketsProps) {
  const { data: markets = [], isLoading, isError } = usePopularMarkets();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-700">人気の市場</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          読み込み中...
        </div>
      </div>
    );
  }

  if (isError || markets.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <h2 className="mb-3 text-sm font-medium text-gray-700">
        人気の市場（取引量順）
      </h2>
      <ul className="space-y-2">
        {markets.map((market) => (
          <li key={market.slug}>
            <button
              type="button"
              onClick={() => onSelect(market.url)}
              className="flex w-full items-start justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus:outline-2 focus:outline-blue-600 focus:-outline-offset-1 cursor-pointer"
            >
              <span className="line-clamp-2 flex-1 font-medium text-gray-900">
                {market.title}
              </span>
              <span className="shrink-0 text-xs text-gray-500 tabular-nums">
                {formatVolume(market.volume)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-500">クリックで分析を開始</p>
    </div>
  );
}
