import type {
  MarketInfo,
  MarketOption,
  Comment,
  TopHolder,
} from "@/types/market";

const POLYMARKET_API_URL = "https://gamma-api.polymarket.com";

export class PolymarketAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = POLYMARKET_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch popular/trending events (by volume), active and not closed
   */
  async getPopularEvents(
    limit = 5,
  ): Promise<
    Array<{ slug: string; title: string; url: string; volume: number }>
  > {
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: "0",
        order: "volume",
        ascending: "false",
        closed: "false",
        active: "true",
      });
      const response = await fetch(`${this.baseUrl}/events?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const events = await response.json();
      if (!Array.isArray(events)) {
        return [];
      }

      return events
        .filter((e: { slug?: string; closed?: boolean }) => e.slug && !e.closed)
        .slice(0, limit)
        .map((e: { slug: string; title?: string; volume?: number }) => ({
          slug: e.slug,
          title: e.title || "Untitled",
          url: `https://polymarket.com/event/${e.slug}`,
          volume: typeof e.volume === "number" ? e.volume : 0,
        }));
    } catch (error) {
      console.error("Failed to fetch popular events:", error);
      return [];
    }
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
      const eventUrl = `${this.baseUrl}/events/slug/${slug}`;
      const response = await fetch(eventUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        return null;
      }

      const event = await response.json();
      return event?.id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch comments with positions and reaction counts
   * Prioritizes holders with high reactions
   */
  async getComments(url: string, holdersOnly = false): Promise<Comment[]> {
    const slug = this.extractMarketSlug(url);
    if (!slug) {
      return [];
    }

    try {
      // First, get event to access markets
      const eventResponse = await fetch(`${this.baseUrl}/events/slug/${slug}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!eventResponse.ok) {
        return [];
      }

      const event = await eventResponse.json();
      const eventId = event?.id;
      const markets = event?.markets || [];

      // Try multiple strategies to get comments
      let allComments: any[] = [];

      // Strategy 1: Try Event-level comments
      const eventComments = await this.fetchCommentsByEntity("Event", eventId);
      if (eventComments.length > 0) {
        allComments = eventComments;
      }

      // Strategy 2: Try Market-level comments (if Event-level failed)
      if (allComments.length === 0 && markets.length > 0) {
        for (const market of markets.slice(0, 5)) {
          // Limit to first 5 markets
          const marketId = market.id || market.marketId;
          if (marketId) {
            const marketComments = await this.fetchCommentsByEntity(
              "market",
              marketId,
            );
            if (marketComments.length > 0) {
              allComments = allComments.concat(marketComments);
            }
          }
        }
      }

      // Strategy 3: Try without order parameter
      if (allComments.length === 0) {
        const paramsNoOrder = new URLSearchParams({
          parent_entity_type: "Event",
          parent_entity_id: eventId.toString(),
          get_positions: "true",
          limit: "100",
          offset: "0",
        });
        const testResponse = await fetch(
          `${this.baseUrl}/comments?${paramsNoOrder}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (testResponse.ok) {
          const testComments = await testResponse.json();
          if (Array.isArray(testComments) && testComments.length > 0) {
            allComments = testComments;
          }
        }
      }

      // Deduplicate comments by ID
      const uniqueComments = Array.from(
        new Map(allComments.map((c) => [c.id, c])).values(),
      );

      return this.mapComments(uniqueComments);
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetch comments by entity type and ID
   */
  private async fetchCommentsByEntity(
    entityType: "Event" | "Series" | "market",
    entityId: number | string,
    holdersOnly = false,
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        parent_entity_type: entityType,
        parent_entity_id: entityId.toString(),
        get_positions: "true",
        limit: "100",
        offset: "0",
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
        return [];
      }

      const comments = await response.json();
      return Array.isArray(comments) ? comments : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Map API comment response to Comment interface
   */
  private mapComments(comments: any[]): Comment[] {
    return comments.map(
      (c: {
        id: string;
        body?: string;
        createdAt?: string;
        reactionCount?: number;
        userAddress?: string;
        profile?: {
          name?: string;
          pseudonym?: string;
          proxyWallet?: string;
          baseAddress?: string;
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
        // Store additional identifiers for matching with top holders
        userAddress:
          c.userAddress || c.profile?.proxyWallet || c.profile?.baseAddress,
        profileName: c.profile?.name,
        profilePseudonym: c.profile?.pseudonym,
      }),
    );
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
    positions?: Array<{ tokenId: string; positionSize: string }>,
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

      const topHolders = Array.from(holdersMap.values()).slice(0, 20);
      return topHolders;
    } catch (error) {
      console.error("Failed to fetch top holders:", error);
      return [];
    }
  }
}
