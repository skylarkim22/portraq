import { z } from "zod";

export const portfolioAssetSchema = z.object({
  ticker: z.string().min(1),
  ratio: z.number().min(0).max(100),
  shares: z.number().min(0),
  order: z.number().int().min(0),
  isSlot: z.boolean().optional(),
});

export const portfolioSchema = z.object({
  name: z.string().min(1, "포트폴리오 이름을 입력해주세요"),
  assets: z.array(portfolioAssetSchema),
});

export const rebalancingStep1Schema = z.object({
  holdings: z.array(
    z.object({
      ticker: z.string().min(1),
      shares: z.number().min(0),
      pricePerShare: z.number().min(0),
    })
  ),
});

export const rebalancingStep2Schema = z.object({
  additionalBudget: z.number().min(0, "투자금을 입력해주세요"),
});

export const tradeLogSchema = z.object({
  type: z.enum(["buy", "sell"]),
  date: z.string().min(1),
  ticker: z.string().min(1),
  quantity: z.number().positive("수량을 입력해주세요"),
  price: z.number().positive("가격을 입력해주세요"),
  tax: z.number().min(0).nullable().optional(),
  exchangeRate: z.number().positive().nullable().optional(),
  memo: z.string().max(1000).nullable().optional(),
});

export type PortfolioFormValues = z.infer<typeof portfolioSchema>;
export type RebalancingStep1Values = z.infer<typeof rebalancingStep1Schema>;
export type RebalancingStep2Values = z.infer<typeof rebalancingStep2Schema>;
export type TradeLogFormValues = z.infer<typeof tradeLogSchema>;
