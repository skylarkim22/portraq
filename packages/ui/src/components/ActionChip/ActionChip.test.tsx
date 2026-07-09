import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActionChip } from "./index";

describe("ActionChip", () => {
  it("action별 기본 레이블을 렌더링한다", () => {
    const { rerender } = render(<ActionChip action="buy" />);
    expect(screen.getByText("매수")).toBeInTheDocument();

    rerender(<ActionChip action="sell" />);
    expect(screen.getByText("매도")).toBeInTheDocument();

    rerender(<ActionChip action="hold" />);
    expect(screen.getByText("유지")).toBeInTheDocument();
  });

  it("children이 있으면 레이블 대신 children을 렌더링한다", () => {
    render(<ActionChip action="buy">BUY</ActionChip>);
    expect(screen.getByText("BUY")).toBeInTheDocument();
  });

  it("buy action에 primary(파란색) 스타일을 적용한다", () => {
    render(<ActionChip action="buy" />);
    expect(screen.getByText("매수").className).toContain("text-primary");
  });

  it("sell action에 red 스타일을 적용한다", () => {
    render(<ActionChip action="sell" />);
    expect(screen.getByText("매도").className).toContain("text-[#dc2626]");
  });
});
