"use client";

import { useAnalyzeMarket } from "@/hooks/useAnalyzeMarket";
import { MarketAnalysisDisplay } from "./components/MarketAnalysis";
import { MarketInput } from "./components/MarketInput";
import { PopularMarkets } from "./components/PopularMarkets";
import Link from "next/link";

export default function Home() {
  const mutation = useAnalyzeMarket();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <Link
              href="/election"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              選挙特化ページ →
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Polymarket市場分析
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto text-start">
            Polymarketの市場URLを入力すると、コメント欄から価格変動の理由をAIが分析し、
            大口ホルダーの意見や反対意見、トリガー条件をまとめて表示します。
          </p>
        </header>

        <div className="max-w-2xl mx-auto space-y-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <MarketInput
              onSubmit={mutation.mutate}
              loading={mutation.isPending}
            />
          </div>
          <PopularMarkets onSelect={mutation.mutate} />
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-red-900 mb-2">エラー</h2>
            <p className="text-red-700">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "予期しないエラーが発生しました"}
            </p>
          </div>
        )}

        {mutation.isPending && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">市場データを取得し、AIで分析中...</p>
            <p className="text-sm text-gray-500 mt-2">
              この処理には数分かかる場合があります
            </p>
          </div>
        )}

        {mutation.isSuccess && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <MarketAnalysisDisplay analysis={mutation.data} />
          </div>
        )}
      </div>
    </div>
  );
}
