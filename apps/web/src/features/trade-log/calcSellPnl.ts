import type { Market } from "@portraq/lib/types";
import { toKrwPrice } from "@portraq/lib/utils";

export type SellRowInput = {
  quantity: number;
  price: number;
  tax?: number | null;
  exchangeRate?: number | null;
};

export type SellPnl = {
  amount: number;
  pnl: number;
  pnlAfterTax: number;
};

// 평균단가(avgPrice)는 항상 원화 환산 기준. 미국 종목은 매도가(price, $)를
// 환율(exchangeRate)로 원화 환산한 뒤 평균단가와 비교한다.
export const calcSellPnl = (
  item: SellRowInput,
  market: Market,
  avgPrice: number
): SellPnl => {
  const priceKrw = toKrwPrice(item.price, market, item.exchangeRate ?? 1);
  const amount = item.quantity * priceKrw;
  const tax = item.tax ?? 0;
  const pnl = (priceKrw - avgPrice) * item.quantity;
  const pnlAfterTax = pnl - tax;

  return { amount, pnl, pnlAfterTax };
};
