export type Market = "KR" | "US";

export type ActionType = "buy" | "sell" | "hold";

export interface Asset {
  ticker: string;
  name: string;
  market: Market;
  color: string;
  isActive: boolean;
}

export interface PortfolioAsset {
  ticker: string;
  ratio: number;
  shares: number;
  order: number;
  isSlot?: boolean;
  name?: string;
  market?: Market;
  color?: string;
  currentPrice?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  memo: string | null;
  assets: PortfolioAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionItem {
  ticker: string;
  action: ActionType;
  quantity: number;
  pricePerShare: number;
}

export interface ExecutionRecord {
  id: string;
  portfolioId: string;
  executedAt: string;
  totalBudget: number;
  actions: ActionItem[];
}

export interface SnapshotAsset {
  ticker: string;
  ratio: number;
  shares: number;
  pricePerShare: number;
}

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  executionRecordId: string;
  assets: SnapshotAsset[];
}

export interface TradeItem {
  ticker: string;
  quantity: number;
  price: number;
  tax?: number | null;
  exchangeRate?: number | null;
}

export interface TradeLog {
  id: string;
  userId: string;
  type: "buy" | "sell";
  date: string;
  items: TradeItem[];
  memo: string | null;
  createdAt: string;
}
