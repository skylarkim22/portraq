import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TemplateFilterTabs } from "@/features/templates/components/TemplateFilterTabs";

describe("TemplateFilterTabs", () => {
  it("전체/패시브/가치투자/퀀트·팩터/자산배분 탭을 모두 보여준다", () => {
    render(<TemplateFilterTabs value="all" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "패시브" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가치투자" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "퀀트·팩터" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "자산배분" })).toBeInTheDocument();
  });

  it("탭을 클릭하면 해당 값으로 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TemplateFilterTabs value="all" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "가치투자" }));

    expect(onChange).toHaveBeenCalledWith("value");
  });
});
