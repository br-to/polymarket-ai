import { PolymarketAPIClient } from "./api-client";
import type { Comment } from "@/types/market";

export class CommentFetcher {
  private apiClient: PolymarketAPIClient;

  constructor() {
    this.apiClient = new PolymarketAPIClient();
  }

  /**
   * Fetch comments prioritizing holders with high reactions
   */
  async fetchComments(url: string): Promise<Comment[]> {
    // Fetch all comments with positions
    const allComments = await this.apiClient.getComments(url, false);

    // Sort by: 1) Has holdings, 2) Reaction count
    return this.prioritizeComments(allComments);
  }

  /**
   * Fetch only comments from holders
   */
  async fetchHolderComments(url: string): Promise<Comment[]> {
    const holderComments = await this.apiClient.getComments(url, true);
    return this.prioritizeComments(holderComments);
  }

  /**
   * Prioritize comments by holdings and reactions
   * Score = (hasHoldings ? 1000 : 0) + reactionCount
   */
  private prioritizeComments(comments: Comment[]): Comment[] {
    return comments.sort((a, b) => {
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      return scoreB - scoreA;
    });
  }

  private calculateScore(comment: Comment): number {
    const hasHoldings = comment.positions && comment.positions.length > 0;
    const holdingBonus = hasHoldings ? 1000 : 0;
    const reactionScore = comment.reactionCount || 0;
    return holdingBonus + reactionScore;
  }
}
