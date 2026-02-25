"use client";

import { useState } from "react";
import { useAnalyzeMarket } from "@/hooks/useAnalyzeMarket";
import { useSearchMarkets } from "@/hooks/useSearchMarkets";
import { MarketAnalysisDisplay } from "./components/MarketAnalysis";
import { TopicSearch } from "./components/TopicSearch";
import { MarketList } from "./components/MarketList";
import { PopularMarkets } from "./components/PopularMarkets";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const searchResult = useSearchMarkets(searchQuery);
  const analyzeMutation = useAnalyzeMarket();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedUrl(null);
    analyzeMutation.reset();
  };

  const handleSelectMarket = (url: string) => {
    setSelectedUrl(url);
    analyzeMutation.mutate(url);
  };

  const handleBack = () => {
    setSelectedUrl(null);
    analyzeMutation.reset();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Polymarket市場分析
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            話題を入力すると関連する予測市場を表示し、
            コメントや大口ホルダーの情報からAIが価格の理由を分析します。
          </p>
        </header>

        <div className="max-w-2xl mx-auto space-y-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <TopicSearch
              onSearch={handleSearch}
              loading={searchResult.isLoading}
            />
          </div>

          {/* 検索結果の市場一覧 */}
          {searchQuery && !selectedUrl && (
            <MarketList
              markets={searchResult.data?.markets || []}
              onSelect={handleSelectMarket}
              loading={searchResult.isLoading}
            />
          )}

          {/* 分析結果 */}
          {selectedUrl && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                ← 検索結果に戻る
              </button>
              {analyzeMutation.isPending && (
                <div className="text-center py-8 text-gray-500">
                  分析中...
                </div>
              )}
              {analyzeMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  エラー: {analyzeMutation.error?.message || "分析に失敗しました"}
                </div>
              )}
              {analyzeMutation.data && (
                <MarketAnalysisDisplay analysis={analyzeMutation.data} />
              )}
            </div>
          )}

          {/* 検索前は人気市場を表示 */}
          {!searchQuery && <PopularMarkets onSelect={handleSelectMarket} />}
        </div>
      </div>
    </div>
  );
}
