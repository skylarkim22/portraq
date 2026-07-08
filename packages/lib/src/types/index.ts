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
  totalAmount: number;
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
  name: string;
  ratio: number;
  shares: number;
  pricePerShare: number;
  color: string;
}

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  executionRecordId: string;
  assets: SnapshotAsset[];
}

export interface TradeLog {
  id: string;
  userId: string;
  type: "buy" | "sell";
  date: string;
  ticker: string;
  quantity: number;
  price: number;
  tax?: number | null;
  exchangeRate?: number | null;
  memo: string | null;
  createdAt: string;
}

export type TemplateStrategy = "passive" | "value" | "quant" | "asset-allocation" | "growth";

export type TemplateMarket = "KR" | "US" | "MIXED";

export interface TemplateAsset {
  ticker: string | null;
  name: string;
  market: Market;
  ratio: number;
  sortOrder: number;
}

export interface PortfolioTemplate {
  id: string;
  name: string;
  strategy: TemplateStrategy;
  market: TemplateMarket;
  cagr: number | null;
  mdd: number | null;
  description: string | null;
  sourceDate: string | null;
  assets: TemplateAsset[];
}
