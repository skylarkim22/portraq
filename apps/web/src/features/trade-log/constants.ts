import type { Market } from "@portraq/lib/types";

export const MEMO_MIN_LENGTH = 20;

// 매도 모달의 기본 환율(원/$). 사용자가 매도 행 추가 시 바로 수정할 수 있다.
export const DEFAULT_EXCHANGE_RATE = 1380;

export const MARKET_BADGE_CLASS: Record<Market, string> = {
  US: "bg-[#eff6ff] text-[#1d4ed8]",
  KR: "bg-[#fff1f2] text-[#be123c]",
};

export const MARKET_COLOR: Record<Market, string> = {
  US: "#1d4ed8",
  KR: "#be123c",
};
