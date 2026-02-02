"use client";

import { ElectionMarkets } from "../components/ElectionMarkets";
import Link from "next/link";

export default function ElectionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← トップページに戻る
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            日本の選挙特化ページ
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl">
            日本の選挙関連の予測市場を集約して表示しています。
            「1位を取るのは？」「2位を取るのは？」「自民党の獲得予想議席は？」などの市場を確認できます。
          </p>
        </header>

        <ElectionMarkets />
      </div>
    </div>
  );
}
