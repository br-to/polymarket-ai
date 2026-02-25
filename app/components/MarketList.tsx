"use client";

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

interface MarketListProps {
  markets: SearchMarket[];
  onSelect: (url: string) => void;
  loading?: boolean;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

function formatPrice(price: number): string {
  return `${price.toFixed(1)}%`;
}

export function MarketList({ markets, onSelect, loading }: MarketListProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        市場を検索中...
      </div>
    );
  }

  if (markets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">{markets.length}件の市場が見つかりました</p>
      {markets.map((market) => (
        <button
          key={market.slug}
          type="button"
          onClick={() => onSelect(market.url)}
          className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <h3 className="font-medium text-gray-900 mb-2">{market.title}</h3>
          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-blue-600">
                Yes {formatPrice(market.yesPrice)}
              </span>
            </span>
            <span>出来高 {formatVolume(market.volume)}</span>
            {market.liquidity > 0 && (
              <span>流動性 {formatVolume(market.liquidity)}</span>
            )}
            {market.commentCount > 0 && (
              <span>💬 {market.commentCount}</span>
            )}
            {market.marketCount > 1 && (
              <span>📊 {market.marketCount}市場</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
