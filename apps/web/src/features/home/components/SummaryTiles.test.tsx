import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SummaryTiles } from "@/features/home/components/SummaryTiles";

describe("SummaryTiles", () => {
  it("총자산과 포트폴리오 수를 보여준다", () => {
    render(<SummaryTiles totalValue={20000} portfolioCount={2} />);

    expect(screen.getByText("20,000원")).toBeInTheDocument();
    expect(screen.getByText("2개")).toBeInTheDocument();
  });

  it("0이면 0으로 보여준다", () => {
    render(<SummaryTiles totalValue={0} portfolioCount={0} />);

    expect(screen.getByText("0원")).toBeInTheDocument();
    expect(screen.getByText("0개")).toBeInTheDocument();
  });
});
