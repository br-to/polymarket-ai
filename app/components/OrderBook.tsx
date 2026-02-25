"use client";

interface OrderBookEntry {
  price: string;
  size: string;
}

interface OrderBookProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastTradePrice: string;
}

function formatSize(size: string): string {
  const n = parseFloat(size);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function OrderBook({ bids, asks, lastTradePrice }: OrderBookProps) {
  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">
        オーダーブックデータがありません
      </div>
    );
  }

  const maxBidSize = Math.max(...bids.map((b) => parseFloat(b.size)), 1);
  const maxAskSize = Math.max(...asks.map((a) => parseFloat(a.size)), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-gray-500">最終取引価格:</span>
        <span className="font-bold">
          {(parseFloat(lastTradePrice) * 100).toFixed(1)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1 flex justify-between">
            <span>価格 (Yes)</span>
            <span>数量</span>
          </div>
          <div className="space-y-px">
            {bids.map((bid, i) => {
              const pct = parseFloat(bid.size) / maxBidSize;
              return (
                <div key={i} className="relative">
                  <div
                    className="absolute inset-0 bg-green-50 rounded-sm"
                    style={{ width: `${pct * 100}%` }}
                  />
                  <div className="relative flex justify-between px-2 py-0.5 text-xs">
                    <span className="text-green-700 font-medium">
                      {(parseFloat(bid.price) * 100).toFixed(1)}
                    </span>
                    <span className="text-gray-600">
                      {formatSize(bid.size)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Asks */}
        <div>
          <div className="text-xs font-medium text-gray-500 mb-1 flex justify-between">
            <span>価格 (No)</span>
            <span>数量</span>
          </div>
          <div className="space-y-px">
            {asks.map((ask, i) => {
              const pct = parseFloat(ask.size) / maxAskSize;
              return (
                <div key={i} className="relative">
                  <div
                    className="absolute inset-0 bg-red-50 rounded-sm right-0"
                    style={{ width: `${pct * 100}%`, marginLeft: "auto" }}
                  />
                  <div className="relative flex justify-between px-2 py-0.5 text-xs">
                    <span className="text-red-700 font-medium">
                      {(parseFloat(ask.price) * 100).toFixed(1)}
                    </span>
                    <span className="text-gray-600">
                      {formatSize(ask.size)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
