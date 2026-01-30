import { GoogleGenAI } from "@google/genai";
import { PromptBuilder, type WeightedComment } from "./prompt-builder";
import type {
  Comment,
  TopHolder,
  MarketOption,
  MarketAnalysis,
} from "@/types/market";

export class MarketAnalyzer {
  private genAI: GoogleGenAI;
  private promptBuilder: PromptBuilder;

  constructor() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    }

    this.genAI = new GoogleGenAI({ apiKey });
    this.promptBuilder = new PromptBuilder();
  }

  async summarizeDescription(description: string): Promise<string> {
    if (!description || description.trim().length === 0) {
      return "";
    }

    try {
      const prompt = `以下のPolymarket市場の解決条件を、重要なポイントを3-5箇条で簡潔にまとめてください。日本語で回答してください。

${description}

重要ポイントを箇条書きで:`;

      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        },
      });

      return response.text?.trim() || description;
    } catch (error: any) {
      // Handle rate limit errors
      if (error?.status === 429 || error?.error?.code === 429) {
        // Return original description instead of throwing
        return description;
      }
      return description;
    }
  }

  async analyzeMarket(
    marketTitle: string,
    marketOptions: MarketOption[],
    comments: Comment[],
    topHolders: TopHolder[],
    marketDescription?: string,
  ): Promise<
    Omit<
      MarketAnalysis,
      | "marketUrl"
      | "marketTitle"
      | "marketDescription"
      | "currentSituation"
      | "marketOptions"
      | "metadata"
    >
  > {
    // Weight comments by holder positions
    const weightedComments = this.promptBuilder.weightComments(
      comments,
      topHolders,
    );

    // Build prompt
    const prompt = this.promptBuilder.buildAnalysisPrompt(
      marketTitle,
      marketOptions,
      weightedComments,
      topHolders,
    );

    // If no comments available, use fallback immediately
    if (comments.length === 0) {
      return await this.fallbackAnalysis(
        weightedComments,
        topHolders,
        marketOptions,
        marketDescription,
      );
    }

    // Call Gemini API
    try {
      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });
      const text = response.text ?? "";

      // Parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(text);
      } catch (parseError) {
        // If response is not valid JSON, try to extract JSON from markdown
        const jsonMatch =
          text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error("Failed to parse JSON from response");
        }
      }

      // Summarize description if provided
      const descriptionSummary = marketDescription
        ? await this.summarizeDescription(marketDescription)
        : undefined;

      // Validate and format response
      return {
        marketDescriptionSummary: descriptionSummary,
        reasons: Array.isArray(analysis.reasons)
          ? analysis.reasons.slice(0, 3)
          : [],
        whaleOpinions: Array.isArray(analysis.whaleOpinions)
          ? analysis.whaleOpinions.slice(0, 5)
          : [],
        opposingViews: Array.isArray(analysis.opposingViews)
          ? analysis.opposingViews
          : [],
        triggers: Array.isArray(analysis.triggers) ? analysis.triggers : [],
      };
    } catch (error: any) {
      // Handle rate limit errors specifically
      if (error?.status === 429 || error?.error?.code === 429) {
        // Rate limit exceeded, use fallback
      }

      // Fallback: simple analysis without AI
      return await this.fallbackAnalysis(
        weightedComments,
        topHolders,
        marketOptions,
        marketDescription,
      );
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private async fallbackAnalysis(
    weightedComments: WeightedComment[],
    topHolders: TopHolder[],
    _marketOptions: MarketOption[],
    marketDescription?: string,
  ): Promise<
    Omit<
      MarketAnalysis,
      | "marketUrl"
      | "marketTitle"
      | "marketDescription"
      | "currentSituation"
      | "marketOptions"
      | "metadata"
    >
  > {
    const whaleComments = weightedComments.filter((c) => c.isWhale).slice(0, 5);

    // Try to summarize description even in fallback
    const descriptionSummary = marketDescription
      ? await this.summarizeDescription(marketDescription).catch(
          () => undefined,
        )
      : undefined;

    // Check if we have any data to work with
    const hasData = whaleComments.length > 0 || topHolders.length > 0;

    return {
      marketDescriptionSummary: descriptionSummary,
      reasons: hasData
        ? [
            "AI分析が一時的に利用できませんでした（APIレート制限の可能性）。",
            "大口ホルダーの意見を優先的に確認することをお勧めします。",
            "市場のルールと解決条件を確認してください。",
          ]
        : [
            "コメントが取得できませんでした。",
            "市場のルールと解決条件を確認してください。",
            "しばらく時間をおいてから再度お試しください。",
          ],
      whaleOpinions: whaleComments.map((c) => ({
        holder: c.author,
        position: c.authorHoldings || "不明",
        comment: c.content.substring(0, 200),
      })),
      opposingViews: ["詳細な分析にはAI機能が必要です。"],
      triggers: [
        "市場の終了日を確認してください。",
        "関連するニュースやイベントを監視してください。",
      ],
    };
  }
}
