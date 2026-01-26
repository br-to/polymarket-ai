export interface MarketInfo {
  url: string;
  title: string;
  description?: string;
  endDate?: string;
  volume?: number;
}

export interface MarketOption {
  name: string;
  price: number; // 0-100 (percentage)
  volume?: number;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  authorPosition?: number; // Position in top holders (if applicable)
  authorHoldings?: string; // Dollar amount
  reactionCount?: number; // Number of likes/reactions
  positions?: Array<{
    tokenId: string;
    positionSize: string;
  }>;
}

export interface TopHolder {
  address: string;
  username?: string;
  position: number;
  holdings: string; // Dollar amount
}

export interface MarketAnalysis {
  marketUrl: string;
  marketTitle: string;
  marketDescription?: string;
  marketDescriptionSummary?: string;
  currentSituation: {
    priceChange: "急変" | "1強" | "均衡";
    dominantOption?: string;
    timestamp: string;
  };
  marketOptions: MarketOption[];
  reasons: string[];
  whaleOpinions: Array<{
    holder: string;
    position: string;
    comment: string;
  }>;
  opposingViews: string[];
  triggers: string[];
  metadata: {
    analyzedAt: string;
    commentCount: number;
    whaleCount: number;
  };
}
