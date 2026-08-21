import { describe, it, expect } from "vitest";
import { buildRebalancingExecutionPayload } from "@/features/portfolio/buildRebalancingExecutionPayload";
import type { RebalancingActionRow } from "@/features/portfolio/deriveActionRows";
import type { PortfolioAsset } from "@portraq/lib/types";

const rows: RebalancingActionRow[] = [
  {
    ticker: "AAPL",
    name: "Apple",
    color: "#355df9",
    currentShares: 10,
    targetShares: 15,
    currentRatio: 40,
    targetRatio: 60,
    pricePerShare: 200,
    quantity: 5,
    action: "buy",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    color: "#6b8ffb",
    currentShares: 10,
    targetShares: 7,
    currentRatio: 20,
    targetRatio: 14,
    pricePerShare: 100,
    quantity: -3,
    action: "sell",
  },
];

const assets: PortfolioAsset[] = [
  { ticker: "AAPL", name: "Apple", color: "#355df9", ratio: 60, shares: 10, order: 0 },
  { ticker: "MSFT", name: "Microsoft", color: "#6b8ffb", ratio: 14, shares: 10, order: 1 },
];

describe("buildRebalancingExecutionPayload", () => {
  it("updatedAssets는 확정된 수량만큼 반영된 결과 주수를 담는다", () => {
    const { updatedAssets } = buildRebalancingExecutionPayload(rows, assets);

    expect(updatedAssets).toEqual([
      { ticker: "AAPL", shares: 15, currentPrice: 200 },
      { ticker: "MSFT", shares: 7, currentPrice: 100 },
    ]);
  });

  it("snapshotAssets는 자산 순서를 유지하며 결과 주수·현재가를 담는다", () => {
    const { snapshotAssets } = buildRebalancingExecutionPayload(rows, assets);

    expect(snapshotAssets).toEqual([
      { ticker: "AAPL", name: "Apple", ratio: 60, shares: 15, pricePerShare: 200, color: "#355df9" },
      { ticker: "MSFT", name: "Microsoft", ratio: 14, shares: 7, pricePerShare: 100, color: "#6b8ffb" },
    ]);
  });

  it("actions는 매도 수량을 음수로 담는다", () => {
    const { actions } = buildRebalancingExecutionPayload(rows, assets);

    const sell = actions.find((a) => a.ticker === "MSFT")!;
    expect(sell.quantity).toBe(-3);
  });

  it("rows에 없는 자산은 기존 shares를 그대로 유지한다", () => {
    const extraAssets: PortfolioAsset[] = [
      ...assets,
      { ticker: "BND", name: "Bond ETF", ratio: 0, shares: 4, order: 2 },
    ];

    const { snapshotAssets } = buildRebalancingExecutionPayload(rows, extraAssets);

    const bnd = snapshotAssets.find((a) => a.ticker === "BND")!;
    expect(bnd.shares).toBe(4);
    expect(bnd.pricePerShare).toBe(0);
  });

  it("커스텀 종목의 isCustom을 snapshotAssets/updatedAssets에 전달한다 (actions는 자산 단위 정보라 중복 저장하지 않음)", () => {
    const customRows: RebalancingActionRow[] = [
      {
        ticker: "custom-uuid-1",
        name: "비상장 펀드",
        color: "#123456",
        currentShares: 3,
        targetShares: 5,
        currentRatio: 30,
        targetRatio: 50,
        pricePerShare: 10000,
        quantity: 2,
        action: "buy",
        isCustom: true,
      },
    ];
    const customAssets: PortfolioAsset[] = [
      { ticker: "custom-uuid-1", name: "비상장 펀드", color: "#123456", ratio: 50, shares: 3, order: 0, isCustom: true },
    ];

    const { actions, snapshotAssets, updatedAssets } = buildRebalancingExecutionPayload(
      customRows,
      customAssets
    );

    expect(actions[0]).not.toHaveProperty("isCustom");
    expect(snapshotAssets[0].isCustom).toBe(true);
    expect(updatedAssets[0].isCustom).toBe(true);
  });
});
