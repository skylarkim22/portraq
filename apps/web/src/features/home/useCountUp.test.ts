import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCountUp } from "@/features/home/useCountUp";

describe("useCountUp", () => {
  it("초기 target 값을 그대로 보여준다", () => {
    const { result } = renderHook(() => useCountUp(20000));

    expect(result.current).toBe(20000);
  });

  it("target이 바뀌지 않으면 값도 그대로 유지된다", () => {
    const { result, rerender } = renderHook(({ value }) => useCountUp(value), {
      initialProps: { value: 3 },
    });

    rerender({ value: 3 });

    expect(result.current).toBe(3);
  });
});
