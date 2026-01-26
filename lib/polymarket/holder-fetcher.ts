import { PolymarketAPIClient } from "./api-client";
import type { TopHolder } from "@/types/market";

export class HolderFetcher {
  private apiClient: PolymarketAPIClient;

  constructor() {
    this.apiClient = new PolymarketAPIClient();
  }

  async fetchTopHolders(url: string): Promise<TopHolder[]> {
    try {
      const apiHolders = await this.apiClient.getTopHolders(url);
      return apiHolders;
    } catch (error) {
      console.error("Failed to fetch top holders:", error);
      return [];
    }
  }
}
