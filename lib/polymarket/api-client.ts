import type { MarketInfo, MarketOption, Comment, TopHolder } from "@/types/market";

const POLYMARKET_API_URL = "https://gamma-api.polymarket.com";

export class PolymarketAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = POLYMARKET_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Extract market slug from URL
   */
  extractMarketSlug(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);

      // Extract event slug
      if (pathParts[0] === "event" && pathParts[1]) {
        return pathParts[1];
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch market information using REST API
   */
  async getMarketInfo(url: string): Promise<MarketInfo | null> {
    const slug = this.extractMarketSlug(url);
    if (!slug) {
      throw new Error("Invalid Polymarket URL");
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/slug/${slug}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const event = await response.json();

      if (!event) {
        return null;
      }

      return {
        url,
        title: event.title || "",
        description: event.description,
        endDate: event.endDate,
        volume: event.volume,
      };
    } catch (error) {
      console.error("API fetch failed:", error);
      return null;
    }
  }

  /**
   * Fetch market options (outcomes with prices) using REST API
   * For multi-option markets, uses groupItemTitle as the option name
   * For binary markets, uses Yes/No
   */
  async getMarketOptions(url: string): Promise<MarketOption[]> {
    const slug = this.extractMarketSlug(url);
    if (!slug) {
      throw new Error("Invalid Polymarket URL");
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/slug/${slug}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const event = await response.json();

      if (!event?.markets) {
        throw new Error("Failed to fetch market options");
      }

      const options: MarketOption[] = [];
      const isMultiOption = event.markets.length > 1;

      for (const market of event.markets) {
        const outcomePrices = market.outcomePrices
          ? JSON.parse(market.outcomePrices)
          : [];
        const yesPrice = parseFloat(outcomePrices[0] || "0") * 100;

        if (isMultiOption) {
          // Multi-option market: use groupItemTitle as the option name
          // Show only the "Yes" probability for each option
          options.push({
            name: market.groupItemTitle || market.question || "Unknown",
            price: yesPrice,
            volume: parseFloat(market.volume || "0"),
          });
        } else {
          // Binary market: use outcomes from API
          const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];

          for (let i = 0; i < outcomes.length; i++) {
            options.push({
              name: outcomes[i],
              price: parseFloat(outcomePrices[i] || "0") * 100,
              volume: parseFloat(market.volume || "0"),
            });
          }
        }
      }

      return options;
    } catch (error) {
      console.error("Failed to fetch market options:", error);
      return [];
    }
  }

  /**
   * Fetch event ID from slug
   */
  async getEventId(url: string): Promise<number | null> {
    const slug = this.extractMarketSlug(url);
    if (!slug) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/events/slug/${slug}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return null;
      }

      const event = await response.json();
      return event?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch comments with positions and reaction counts
   * Prioritizes holders with high reactions
   */
  async getComments(url: string, holdersOnly = false): Promise<Comment[]> {
    const eventId = await this.getEventId(url);
    if (!eventId) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        parent_entity_type: "Event",
        parent_entity_id: eventId.toString(),
        get_positions: "true",
        limit: "100",
        offset: "0", // Required parameter for pagination
        order: "reactionCount",
        ascending: "false",
      });

      if (holdersOnly) {
        params.append("holders_only", "true");
      }

      const response = await fetch(`${this.baseUrl}/comments?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Comments API failed: ${response.statusText}`);
      }

      const comments = await response.json();

      return comments.map((c: {
        id: string;
        body?: string;
        createdAt?: string;
        reactionCount?: number;
        profile?: {
          name?: string;
          pseudonym?: string;
          positions?: Array<{ tokenId: string; positionSize: string }>;
        };
      }) => ({
        id: c.id,
        author: c.profile?.name || c.profile?.pseudonym || "Anonymous",
        content: c.body || "",
        timestamp: c.createdAt || "",
        reactionCount: c.reactionCount || 0,
        positions: c.profile?.positions || [],
        authorHoldings: this.calculateTotalHoldings(c.profile?.positions),
      }));
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      return [];
    }
  }

  /**
   * Format large numbers in short form (K, M, B) as shares
   */
  private formatShares(amount: number): string {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2)}B shares`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(2)}M shares`;
    }
    if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1)}K shares`;
    }
    return `${amount.toFixed(0)} shares`;
  }

  /**
   * Calculate total holdings from positions
   */
  private calculateTotalHoldings(
    positions?: Array<{ tokenId: string; positionSize: string }>
  ): string | undefined {
    if (!positions || positions.length === 0) {
      return undefined;
    }

    const total = positions.reduce((sum, p) => {
      return sum + parseFloat(p.positionSize || "0");
    }, 0);

    if (total === 0) return undefined;

    return this.formatShares(total);
  }

  /**
   * Fetch top holders from Data API
   */
  async getTopHolders(url: string): Promise<TopHolder[]> {
    const slug = this.extractMarketSlug(url);
    if (!slug) {
      return [];
    }

    try {
      // First get market conditionIds from event
      const eventResponse = await fetch(`${this.baseUrl}/events/slug/${slug}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!eventResponse.ok) {
        return [];
      }

      const event = await eventResponse.json();
      const markets = event?.markets || [];

      if (markets.length === 0) {
        return [];
      }

      // Get conditionIds (limit to first 5 markets to avoid too many requests)
      const conditionIds = markets
        .slice(0, 5)
        .map((m: { conditionId?: string }) => m.conditionId)
        .filter(Boolean);

      if (conditionIds.length === 0) {
        return [];
      }

      // Fetch holders from Data API
      const holdersResponse = await fetch(
        `https://data-api.polymarket.com/holders?market=${conditionIds.join(",")}&limit=20`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!holdersResponse.ok) {
        return [];
      }

      const holdersData = await holdersResponse.json();

      // Flatten and dedupe holders
      const holdersMap = new Map<string, TopHolder>();
      let position = 1;

      for (const tokenData of holdersData) {
        for (const holder of tokenData.holders || []) {
          const key = holder.proxyWallet || holder.name || holder.pseudonym;
          if (!holdersMap.has(key)) {
            holdersMap.set(key, {
              address: holder.proxyWallet || "",
              username: holder.name || holder.pseudonym || undefined,
              position: position++,
              holdings: this.formatShares(holder.amount || 0),
            });
          }
        }
      }

      return Array.from(holdersMap.values()).slice(0, 20);
    } catch (error) {
      console.error("Failed to fetch top holders:", error);
      return [];
    }
  }
}
