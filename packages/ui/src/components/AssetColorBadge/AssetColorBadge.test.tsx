import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AssetColorBadge } from "./index";

describe("AssetColorBadge", () => {
  it("name의 첫 글자를 보여준다", () => {
    render(<AssetColorBadge ticker="005930" name="삼성전자" />);
    expect(screen.getByText("삼")).toBeInTheDocument();
  });

  it("name이 없으면 ticker의 첫 글자를 보여준다", () => {
    render(<AssetColorBadge ticker="AAPL" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("name이 여러 단어면 첫 단어의 첫 글자만 보여준다", () => {
    render(<AssetColorBadge ticker="AAPL" name="Apple Inc." />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("color를 지정하면 그 색으로, 없으면 기본 색으로 렌더링한다", () => {
    const { rerender } = render(<AssetColorBadge ticker="AAPL" color="#123456" />);
    expect(screen.getByText("A")).toHaveStyle({ color: "#123456" });

    rerender(<AssetColorBadge ticker="AAPL" />);
    expect(screen.getByText("A").getAttribute("style")).toContain("color");
  });
});
