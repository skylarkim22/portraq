import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { InfoPopover } from "./index";

describe("InfoPopover", () => {
  it("기본 상태에서는 설명이 숨겨져 있다", () => {
    render(<InfoPopover label="CAGR 설명">연평균 복리 수익률입니다.</InfoPopover>);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("아이콘 버튼을 클릭하면 설명이 노출된다", async () => {
    const user = userEvent.setup();
    render(<InfoPopover label="CAGR 설명">연평균 복리 수익률입니다.</InfoPopover>);

    await user.click(screen.getByRole("button", { name: "CAGR 설명" }));

    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "연평균 복리 수익률입니다."
    );
  });

  it("다시 클릭하면 설명이 닫힌다", async () => {
    const user = userEvent.setup();
    render(<InfoPopover label="CAGR 설명">연평균 복리 수익률입니다.</InfoPopover>);

    const button = screen.getByRole("button", { name: "CAGR 설명" });
    await user.click(button);
    await user.click(button);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("바깥 영역을 클릭하면 설명이 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <InfoPopover label="CAGR 설명">연평균 복리 수익률입니다.</InfoPopover>
        <button type="button">바깥 버튼</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "CAGR 설명" }));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "바깥 버튼" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
