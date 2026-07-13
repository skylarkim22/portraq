import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useCountUp } from "@/features/home/useCountUp";

describe("useCountUp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("애니메이션 도중 target이 바뀌면 중단 시점 값에서 이어서 시작한다", () => {
    let now = 0;
    const callbacks: FrameRequestCallback[] = [];

    vi.stubGlobal("performance", { now: () => now } as unknown as Performance);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const { result, rerender } = renderHook(({ value }) => useCountUp(value), {
      initialProps: { value: 0 },
    });

    rerender({ value: 100 });

    now = 300;
    act(() => {
      callbacks.pop()?.(now);
    });
    const interruptedValue = result.current;
    expect(interruptedValue).toBeGreaterThan(0);
    expect(interruptedValue).toBeLessThan(100);

    rerender({ value: 50 });

    act(() => {
      callbacks.pop()?.(now);
    });

    expect(result.current).toBeCloseTo(interruptedValue, 5);
  });
});
