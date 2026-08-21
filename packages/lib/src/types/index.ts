export type Market = "KR" | "US";

export type ActionType = "buy" | "sell" | "hold";

export type DividendFrequency = "monthly" | "quarterly" | "semiannual" | "annual";

export interface Asset {
  ticker: string;
  name: string;
  market: Market;
  color: string;
  isActive: boolean;
  // 배당 스케줄. 무배당 종목은 null. dividendMonths는 배당기준일 기준 지급 월.
  dividendFrequency: DividendFrequency | null;
  dividendMonths: number[] | null;
  // 카탈로그(assets)가 아닌 사용자가 직접 추가한 종목(custom_assets)이면 true.
  isCustom?: boolean;
}

export interface PortfolioAsset {
  ticker: string;
  ratio: number;
  shares: number;
  order: number;
  // 아직 미확정이라 저장하지 않는 슬롯이면 true.
  isSlot?: boolean;
  // 확정됐고 저장은 하지만 카탈로그(assets) 종목이 아니라 custom_assets
  // 종목이면 true. 이 경우 ticker에는 assets.ticker 대신 custom_assets.id가 담긴다.
  isCustom?: boolean;
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
  name: string;
  ratio: number;
  shares: number;
  pricePerShare: number;
  color: string;
  isCustom?: boolean;
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
  // 카탈로그(assets)가 아닌 사용자가 직접 추가한 종목(custom_assets)이면 true.
  // 이 경우 ticker에는 assets.ticker 대신 custom_assets.id가 담긴다.
  isCustom?: boolean;
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
