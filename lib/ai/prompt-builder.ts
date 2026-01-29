import type { Comment, TopHolder, MarketOption } from "@/types/market";

export interface WeightedComment extends Comment {
  weight: number;
  isWhale: boolean;
}

export class PromptBuilder {
  /**
   * Weight comments based on:
   * 1. Direct position holdings (from comment's positions field)
   * 2. Top holder match
   * 3. Reaction count (likes)
   */
  weightComments(
    comments: Comment[],
    topHolders: TopHolder[],
  ): WeightedComment[] {
    // Create multiple maps for matching by different identifiers
    const holderMapByUsername = new Map<string, TopHolder>();
    const holderMapByAddress = new Map<string, TopHolder>();

    for (const holder of topHolders) {
      // Map by username (name or pseudonym)
      if (holder.username) {
        holderMapByUsername.set(holder.username.toLowerCase(), holder);
      }
      // Map by address
      if (holder.address) {
        holderMapByAddress.set(holder.address.toLowerCase(), holder);
      }
    }

    return comments.map((comment) => {
      // Try multiple matching strategies
      let holder: TopHolder | undefined;

      // Strategy 1: Match by username (name or pseudonym)
      if (comment.profileName) {
        holder = holderMapByUsername.get(comment.profileName.toLowerCase());
      }
      if (!holder && comment.profilePseudonym) {
        holder = holderMapByUsername.get(comment.profilePseudonym.toLowerCase());
      }
      if (!holder && comment.author !== "Anonymous") {
        holder = holderMapByUsername.get(comment.author.toLowerCase());
      }

      // Strategy 2: Match by address (userAddress, proxyWallet, baseAddress)
      if (!holder && comment.userAddress) {
        holder = holderMapByAddress.get(comment.userAddress.toLowerCase());
      }

      // Check if comment author has positions (from API response)
      const hasDirectPositions = !!(comment.positions && comment.positions.length > 0);
      const isWhale: boolean = !!holder || hasDirectPositions;

      // Calculate weight based on multiple factors
      let weight = 1.0;

      // Factor 1: Direct position holdings from comment API
      if (hasDirectPositions) {
        const totalPosition = comment.positions!.reduce((sum, p) => {
          return sum + parseFloat(p.positionSize || "0");
        }, 0);
        // Log scale for position size
        weight += Math.log10(Math.max(totalPosition, 1)) * 0.5;
      }

      // Factor 2: Top holder match (additional bonus)
      if (holder) {
        const holdingsValue = parseFloat(
          holder.holdings.replace(/[^0-9.]/g, ""),
        );
        weight += Math.log10(Math.max(holdingsValue, 1)) * 0.3;
      }

      // Factor 3: Reaction count (likes boost)
      const reactions = comment.reactionCount || 0;
      if (reactions > 0) {
        // Each reaction adds small weight, capped at 2.0
        weight += Math.min(reactions * 0.1, 2.0);
      }

      return {
        ...comment,
        weight,
        isWhale,
        authorPosition: holder?.position,
        authorHoldings: comment.authorHoldings || holder?.holdings,
      };
    });
  }

  /**
   * Build prompt for AI analysis
   */
  buildAnalysisPrompt(
    marketTitle: string,
    marketOptions: MarketOption[],
    weightedComments: WeightedComment[],
    topHolders: TopHolder[],
  ): string {
    // Sort comments by weight (whales first)
    const sortedComments = [...weightedComments].sort(
      (a, b) => b.weight - a.weight,
    );

    // Separate whale comments
    const whaleComments = sortedComments.filter((c) => c.isWhale);
    const regularComments = sortedComments.filter((c) => !c.isWhale);

    // Build market situation description
    const dominantOption = marketOptions.find((opt) => opt.price > 50);
    const isOneSided = dominantOption && dominantOption.price > 80;
    const situation = isOneSided
      ? `1強状態: ${dominantOption.name}が${dominantOption.price.toFixed(1)}%を占めています`
      : "複数の選択肢が競合している状態です";

    const prompt = `あなたはPolymarket（予測市場）の市場分析専門家です。以下の情報を基に、市場の状況を分析してください。

## 市場情報
- 市場タイトル: ${marketTitle}
- 現在の状況: ${situation}
- 選択肢と価格:
${marketOptions
  .map((opt) => `  - ${opt.name}: ${opt.price.toFixed(1)}%`)
  .join("\n")}

## 大口ホルダー（Top Holders）
${topHolders
  .slice(0, 10)
  .map(
    (h, i) =>
      `${i + 1}. ${h.username || h.address}: ${h.holdings} (ポジション: ${h.position})`,
  )
  .join("\n")}

## コメント分析

### 大口ホルダーのコメント（重み付け高）
${whaleComments
  .slice(0, 20)
  .map(
    (c) =>
      `[重み: ${c.weight.toFixed(2)}, いいね: ${c.reactionCount || 0}] ${c.author} (保有: ${c.authorHoldings || "不明"}): ${c.content}`,
  )
  .join("\n\n")}

### 一般ユーザーのコメント（いいね数順）
${regularComments
  .slice(0, 30)
  .map((c) => `[いいね: ${c.reactionCount || 0}] ${c.author}: ${c.content}`)
  .join("\n\n")}

## 分析依頼

以下の形式でJSON形式で回答してください：

{
  "reasons": [
    "理由1（価格変動の主な根拠）",
    "理由2",
    "理由3"
  ],
  "whaleOpinions": [
    {
      "holder": "ホルダー名",
      "position": "保有額",
      "comment": "主張の要約"
    }
  ],
  "opposingViews": [
    "反対意見1",
    "反対意見2"
  ],
  "triggers": [
    "次に動く条件1（トリガー）",
    "次に動く条件2"
  ]
}

重要:
- 大口ホルダーの意見を優先的に考慮してください
- 反対意見も必ず含めてください
- トリガーは具体的で測定可能な条件を挙げてください
- 日本語で回答してください`;

    return prompt;
  }
}
