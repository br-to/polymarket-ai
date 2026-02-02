"use client";

import { useElectionMarkets, type ElectionMarket } from "@/hooks/useElectionMarkets";
import Link from "next/link";

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(1)}K`;
  }
  return `$${volume.toFixed(0)}`;
}

type CardVariant = "ranking" | "seats" | "party" | "other";

const variantStyles: Record<
  CardVariant,
  {
    card: string;
    bar: string;
    percent: string;
  }
> = {
  ranking: {
    card: "bg-gradient-to-br from-white to-indigo-50/30 hover:shadow-indigo-100",
    bar: "bg-indigo-500",
    percent: "text-indigo-600",
  },
  seats: {
    card: "bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-emerald-100",
    bar: "bg-emerald-500",
    percent: "text-emerald-600",
  },
  party: {
    card: "bg-gradient-to-br from-white to-amber-50/30 hover:shadow-amber-100",
    bar: "bg-amber-500",
    percent: "text-amber-600",
  },
  other: {
    card: "bg-gradient-to-br from-white to-violet-50/30 hover:shadow-violet-100",
    bar: "bg-violet-500",
    percent: "text-violet-600",
  },
};

const sectionHeaderStyles: Record<CardVariant, string> = {
  ranking: "border-l-4 border-indigo-500 pl-3 text-indigo-800",
  seats: "border-l-4 border-emerald-500 pl-3 text-emerald-800",
  party: "border-l-4 border-amber-500 pl-3 text-amber-800",
  other: "border-l-4 border-violet-500 pl-3 text-violet-800",
};

function ElectionMarketCard({
  market,
  variant = "other",
}: {
  market: ElectionMarket;
  variant?: CardVariant;
}) {
  const styles = variantStyles[variant];
  const topOption = market.options
    ? market.options.reduce((prev, current) =>
        current.price > prev.price ? current : prev
      )
    : null;

  return (
    <Link
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md ${styles.card}`}
    >
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          {market.title}
        </h3>
      </div>

      {topOption && (
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {topOption.name}
            </span>
            <span className={`text-lg font-bold ${styles.percent}`}>
              {topOption.price.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${styles.bar} transition-all rounded-full`}
              style={{ width: `${topOption.price}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>取引量: {formatVolume(market.volume)}</span>
        {market.options && market.options.length > 0 && (
          <span>{market.options.length}選択肢</span>
        )}
      </div>
    </Link>
  );
}

export function ElectionMarkets() {
  const { data: markets = [], isLoading, isError } = useElectionMarkets();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">選挙市場</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          読み込み中...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/50 p-6">
        <h2 className="mb-2 text-xl font-semibold text-red-900">選挙市場</h2>
        <p className="text-sm text-red-700">
          選挙市場の取得に失敗しました。しばらくしてから再度お試しください。
        </p>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">選挙市場</h2>
        <p className="text-sm text-gray-600">
          現在、選挙関連の市場が見つかりませんでした。
        </p>
      </div>
    );
  }

  // Group markets by type (タイトルはAPIで日本語に変換済み)
  const marketsByType = {
    ranking: markets.filter(
      (m) =>
        m.title.includes("勝者") ||
        m.title.includes("1位") ||
        m.title.includes("2位") ||
        m.title.includes("3位") ||
        m.title.includes("過半数を獲得する？")
    ),
    seats: markets.filter(
      (m) =>
        (m.title.includes("議席") || m.title.includes("獲得議席")) &&
        !m.title.includes("勝者") &&
        !m.title.includes("過半数を獲得する？") &&
        !m.title.includes("議席を減らす")
    ),
    party: markets.filter(
      (m) =>
        m.title.includes("与党") ||
        m.title.includes("議席を減らす")
    ),
    other: markets.filter(
      (m) =>
        !m.title.includes("勝者") &&
        !m.title.includes("1位") &&
        !m.title.includes("2位") &&
        !m.title.includes("3位") &&
        !m.title.includes("過半数を獲得する？") &&
        !m.title.includes("議席数") &&
        !m.title.includes("獲得議席") &&
        !m.title.includes("与党") &&
        !m.title.includes("議席を減らす")
    ),
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          日本の選挙市場
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          日本の選挙関連の予測市場を表示しています。各市場をクリックするとPolymarketで詳細を確認できます。
        </p>
      </div>

      {marketsByType.ranking.length > 0 && (
        <section>
          <h3
            className={`mb-3 text-lg font-semibold ${sectionHeaderStyles.ranking}`}
          >
            順位予測
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketsByType.ranking.map((market) => (
              <ElectionMarketCard
                key={market.slug}
                market={market}
                variant="ranking"
              />
            ))}
          </div>
        </section>
      )}

      {marketsByType.seats.length > 0 && (
        <section>
          <h3
            className={`mb-3 text-lg font-semibold ${sectionHeaderStyles.seats}`}
          >
            議席予測
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketsByType.seats.map((market) => (
              <ElectionMarketCard
                key={market.slug}
                market={market}
                variant="seats"
              />
            ))}
          </div>
        </section>
      )}

      {marketsByType.party.length > 0 && (
        <section>
          <h3
            className={`mb-3 text-lg font-semibold ${sectionHeaderStyles.party}`}
          >
            政党関連
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketsByType.party.map((market) => (
              <ElectionMarketCard
                key={market.slug}
                market={market}
                variant="party"
              />
            ))}
          </div>
        </section>
      )}

      {marketsByType.other.length > 0 && (
        <section>
          <h3
            className={`mb-3 text-lg font-semibold ${sectionHeaderStyles.other}`}
          >
            その他
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketsByType.other.map((market) => (
              <ElectionMarketCard
                key={market.slug}
                market={market}
                variant="other"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
