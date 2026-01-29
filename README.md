# Polymarket市場分析

PolymarketのURLを入力すると、コメント欄から価格変動の理由をAIが分析し、大口ホルダーの意見や反対意見、トリガー条件をまとめて表示するツールです。

## 機能

- Polymarket市場データの自動取得（Gamma API）
- コメントの重み付け分析（ホルダーポジション + いいね数）
- Gemini 2.5 FlashによるAI分析
  - 価格変動の理由
  - 大口ホルダーの主張
  - 反対意見
  - 次に動く条件（トリガー）

## セットアップ

### 必要なもの

- Node.js 20+
- pnpm
- Google AI Studio APIキー

### インストール

```bash
pnpm install
```

### 環境変数

`.env.local`を作成し、以下を設定：

```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

APIキーは[Google AI Studio](https://aistudio.google.com/apikey)から取得できます。

### 開発サーバー起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)を開く。

## 使い方

1. PolymarketのイベントURLを入力
   - 例: `https://polymarket.com/event/which-company-has-the-best-ai-model-end-of-january`
2. 「分析」ボタンをクリック
3. AI分析結果を確認

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **データフェッチング**: TanStack Query
- **AI**: Google Gemini 2.5 Flash (`@google/genai`)
- **リンター/フォーマッター**: Biome

## スクリプト

```bash
pnpm dev      # 開発サーバー
pnpm build    # プロダクションビルド
pnpm start    # プロダクションサーバー
pnpm lint     # リントチェック
pnpm format   # フォーマット
```

## API

### POST /api/analyze

市場URLを受け取り、分析結果を返す。

**リクエスト:**
```json
{
  "url": "https://polymarket.com/event/..."
}
```

**レスポンス:**
```json
{
  "marketUrl": "...",
  "marketTitle": "...",
  "currentSituation": {
    "priceChange": "1強" | "急変" | "均衡",
    "dominantOption": "OpenAI 45.3%"
  },
  "marketOptions": [...],
  "reasons": ["...", "...", "..."],
  "whaleOpinions": [...],
  "opposingViews": [...],
  "triggers": [...]
}
```
