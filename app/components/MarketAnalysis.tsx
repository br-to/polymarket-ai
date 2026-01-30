"use client";

import type { MarketAnalysis } from "@/types/market";

interface MarketAnalysisProps {
  analysis: MarketAnalysis;
}

export function MarketAnalysisDisplay({ analysis }: MarketAnalysisProps) {
  const {
    marketTitle,
    marketDescriptionSummary,
    marketOptions,
    reasons,
    whaleOpinions,
    opposingViews,
    triggers,
    metadata,
  } = analysis;

  const getOptionColor = (price: number) => {
    if (price >= 70) return "bg-green-500";
    if (price >= 50) return "bg-green-400";
    if (price >= 30) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{marketTitle}</h1>
        {marketDescriptionSummary && (
          <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              解決条件（要約）
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {marketDescriptionSummary}
            </p>
          </div>
        )}
        <a
          href={analysis.marketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          市場ページを開く →
        </a>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold mb-3">現在の価格</h2>
        <div className="space-y-3">
          {marketOptions
            .sort((a, b) => b.price - a.price)
            .map((option, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{option.name}</span>
                  <span className="font-bold">{option.price.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getOptionColor(option.price)}`}
                    style={{ width: `${Math.min(option.price, 100)}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold mb-3">理由まとめ（AI分析）</h2>
        <ol className="list-decimal list-inside space-y-2">
          {reasons.map((reason, index) => (
            <li key={index} className="text-gray-700">
              {reason}
            </li>
          ))}
        </ol>
      </div>

      {whaleOpinions.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-3">大口の主張</h2>
          <div className="space-y-3">
            {whaleOpinions.map((opinion, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{opinion.holder}</span>
                  <span className="text-sm text-gray-500">
                    ({opinion.position})
                  </span>
                </div>
                <p className="text-gray-700">{opinion.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {opposingViews.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-3">反対意見</h2>
          <ul className="list-disc list-inside space-y-1">
            {opposingViews.map((view, index) => (
              <li key={index} className="text-gray-700">
                {view}
              </li>
            ))}
          </ul>
        </div>
      )}

      {triggers.length > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-3">次に動く条件（トリガー）</h2>
          <ul className="list-disc list-inside space-y-1">
            {triggers.map((trigger, index) => (
              <li key={index} className="text-gray-700">
                {trigger}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-gray-500 p-4 bg-white rounded-lg border border-gray-200">
        <span>
          分析: {new Date(metadata.analyzedAt).toLocaleString("ja-JP")}
        </span>
        <span>コメント: {metadata.commentCount}件</span>
      </div>
    </div>
  );
}
