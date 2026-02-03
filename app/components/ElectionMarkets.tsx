"use client";

import { useElectionMarkets, type ElectionMarket } from "@/hooks/useElectionMarkets";
import Link from "next/link";

function formatVolume(volume: number): string {
  return `${Math.round(volume).toLocaleString()}ドル`;
}

// Yes/No のどちらが優勢かを判定（選択肢名で）
function getLeadingYesNo(optionName: string): "yes" | "no" | null {
  const n = optionName.trim().toLowerCase();
  if (n === "yes" || n === "はい") return "yes";
  if (n === "no" || n === "いいえ") return "no";
  return null;
}

// 政党ごとのセクションID（タイトルに含まれるキーワードで判定）
const PARTY_SECTIONS: Array<{ id: string; label: string; keywords: string[] }> = [
  { id: "ldp", label: "自民党", keywords: ["自民党"] },
  { id: "cra", label: "中道改革連合", keywords: ["中道改革連合"] },
  { id: "jip", label: "日本維新の会", keywords: ["日本維新の会", "維新"] },
  { id: "dpfp", label: "国民民主党", keywords: ["国民民主党"] },
  { id: "reiwa", label: "れいわ新選組", keywords: ["れいわ新選組", "れいわ"] },
];

function getPartySectionKey(title: string): string | null {
  for (const { id, keywords } of PARTY_SECTIONS) {
    if (keywords.some((k) => title.includes(k))) return id;
  }
  return null;
}

type CardVariant = "ranking" | "seats" | "party" | "other";
type OutcomeStyle = "yes" | "no" | "neutral"; // Yes優勢 / No優勢 / その他

const variantStyles: Record<
  CardVariant,
  { card: string; bar: string; percent: string }
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

// Yes/No 用の意味のある色（Yes=緑・No=赤）
const outcomeStyles: Record<OutcomeStyle, { bar: string; percent: string }> = {
  yes: { bar: "bg-emerald-500", percent: "text-emerald-600" },
  no: { bar: "bg-rose-500", percent: "text-rose-600" },
  neutral: { bar: "", percent: "" }, // variant にフォールバック
};

const sectionHeaderStyles: Record<string, string> = {
  ranking: "border-l-4 border-indigo-500 pl-3 text-indigo-800",
  seats: "border-l-4 border-emerald-500 pl-3 text-emerald-800",
  party: "border-l-4 border-amber-500 pl-3 text-amber-800",
  other: "border-l-4 border-violet-500 pl-3 text-violet-800",
  ldp: "border-l-4 border-red-600 pl-3 text-red-800",
  cra: "border-l-4 border-blue-600 pl-3 text-blue-800",
  jip: "border-l-4 border-orange-600 pl-3 text-orange-800",
  dpfp: "border-l-4 border-teal-600 pl-3 text-teal-800",
  reiwa: "border-l-4 border-pink-600 pl-3 text-pink-800",
  multi: "border-l-4 border-slate-600 pl-3 text-slate-800",
};

function ElectionMarketCard({
  market,
  variant = "other",
}: {
  market: ElectionMarket;
  variant?: CardVariant;
}) {
  const topOption = market.options
    ? market.options.reduce((prev, current) =>
        current.price > prev.price ? current : prev
      )
    : null;

  const leadingYesNo = topOption ? getLeadingYesNo(topOption.name) : null;
  const outcomeStyle: OutcomeStyle =
    leadingYesNo === "yes" ? "yes" : leadingYesNo === "no" ? "no" : "neutral";

  const variantStyle = variantStyles[variant];
  const barClass =
    outcomeStyle === "neutral"
      ? variantStyle.bar
      : outcomeStyles[outcomeStyle].bar;
  const percentClass =
    outcomeStyle === "neutral"
      ? variantStyle.percent
      : outcomeStyles[outcomeStyle].percent;

  return (
    <Link
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-gray-200 p-4 shadow-sm transition-all hover:shadow-md ${variantStyle.card}`}
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
            <span className={`text-lg font-bold ${percentClass}`}>
              {topOption.price.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${barClass} transition-all rounded-full`}
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

  // 政党ごと + 順位・与党・その他 でグループ（タイトルはAPIで日本語に変換済み）
  const isRanking = (m: ElectionMarket) =>
    m.title.includes("勝者") ||
    m.title.includes("1位") ||
    m.title.includes("2位") ||
    m.title.includes("3位") ||
    m.title.includes("過半数を獲得する？");
  const isMultiParty = (m: ElectionMarket) =>
    m.title.includes("与党") || m.title.includes("議席を減らす");

  const marketsByParty = new Map<string, ElectionMarket[]>();
  for (const { id, label } of PARTY_SECTIONS) {
    marketsByParty.set(id, []);
  }
  marketsByParty.set("ranking", []);
  marketsByParty.set("multi", []);
  marketsByParty.set("other", []);

  for (const m of markets) {
    const partyKey = getPartySectionKey(m.title);
    if (partyKey) {
      marketsByParty.get(partyKey)!.push(m);
    } else if (isRanking(m)) {
      marketsByParty.get("ranking")!.push(m);
    } else if (isMultiParty(m)) {
      marketsByParty.get("multi")!.push(m);
    } else {
      marketsByParty.get("other")!.push(m);
    }
  }

  const partySectionOrder: Array<{ key: string; label: string; variant: CardVariant }> = [
    ...PARTY_SECTIONS.map((p) => ({ key: p.id, label: p.label, variant: "seats" as CardVariant })),
    { key: "ranking", label: "順位予測", variant: "ranking" },
    { key: "multi", label: "与党・議席を減らす", variant: "party" },
    { key: "other", label: "その他", variant: "other" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          日本の選挙市場
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          日本の選挙関連の予測市場を表示しています。各市場をクリックするとPolymarketで詳細を確認できます。
          <span className="mt-2 block text-xs text-gray-500">
            バーが緑＝Yes優勢・赤＝No優勢（Yes/Noの市場のみ）
          </span>
        </p>
      </div>

      {partySectionOrder.map(({ key, label, variant }) => {
        const list = marketsByParty.get(key) ?? [];
        if (list.length === 0) return null;
        const headerStyle = sectionHeaderStyles[key] ?? sectionHeaderStyles.other;
        return (
          <section key={key}>
            <h3 className={`mb-3 text-lg font-semibold ${headerStyle}`}>
              {label}
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((market) => (
                <ElectionMarketCard
                  key={market.slug}
                  market={market}
                  variant={variant}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
