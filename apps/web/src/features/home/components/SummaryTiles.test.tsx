import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SummaryTiles } from "@/features/home/components/SummaryTiles";

describe("SummaryTiles", () => {
  it("총자산과 포트폴리오 수를 보여준다", () => {
    render(<SummaryTiles totalValue={1234500} portfolioCount={3} />);

    expect(screen.getByText("1,234,500원")).toBeInTheDocument();
    expect(screen.getByText("3개")).toBeInTheDocument();
  });
});
