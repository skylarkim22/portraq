import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AssetList } from "@/features/portfolio/components/AssetList";
import type { PortfolioAsset } from "@portraq/lib/types";

const baseAssets: PortfolioAsset[] = [
  {
    ticker: "AAPL",
    name: "Apple",
    market: "US",
    color: "#355df9",
    ratio: 60,
    shares: 0,
    currentPrice: 0,
    order: 0,
  },
  {
    ticker: "SLOT_1",
    name: "기타 (비공개 종목)",
    market: "US",
    color: "#e4e4e7",
    ratio: 40,
    shares: 0,
    currentPrice: 0,
    order: 1,
    isSlot: true,
  },
];

describe("AssetList", () => {
  it("일반 종목은 티커/시장 정보를 보여준다", () => {
    render(
      <AssetList
        assets={baseAssets}
        onRatioChange={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
        onFillSlot={vi.fn()}
      />
    );

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText(/AAPL · US/)).toBeInTheDocument();
  });

  it("isSlot 종목은 채우기 버튼으로 표시된다", () => {
    render(
      <AssetList
        assets={baseAssets}
        onRatioChange={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
        onFillSlot={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
    ).toBeInTheDocument();
    expect(screen.getByText("클릭해서 종목을 추가하세요")).toBeInTheDocument();
  });

  it("슬롯 버튼을 클릭하면 onFillSlot이 해당 슬롯의 티커와 함께 호출된다", async () => {
    const onFillSlot = vi.fn();
    const user = userEvent.setup();
    render(
      <AssetList
        assets={baseAssets}
        onRatioChange={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
        onFillSlot={onFillSlot}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
    );

    expect(onFillSlot).toHaveBeenCalledWith("SLOT_1");
  });
});
