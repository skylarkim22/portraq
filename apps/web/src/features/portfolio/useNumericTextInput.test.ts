import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useNumericTextInput } from "@/features/portfolio/useNumericTextInput";

describe("useNumericTextInput", () => {
  it("정수만 입력하도록 소수점을 거부한다 (decimalPlaces 미지정)", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 0, onChange })
    );

    act(() => result.current.handleChange("12.5"));

    expect(result.current.text).toBe("0");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("decimalPlaces만큼 소수점 입력을 허용한다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 0, onChange, max: 100, decimalPlaces: 2 })
    );

    act(() => result.current.handleChange("12.5"));

    expect(result.current.text).toBe("12.5");
    expect(onChange).toHaveBeenCalledWith(12.5);
  });

  it("max를 초과하는 값은 반영하지 않는다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 50, onChange, max: 100 })
    );

    act(() => result.current.handleChange("150"));

    expect(result.current.text).toBe("50");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("thousandsSeparator가 true면 천단위 콤마를 표시한다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 0, onChange, thousandsSeparator: true })
    );

    act(() => result.current.handleChange("1000000"));

    expect(result.current.text).toBe("1,000,000");
    expect(onChange).toHaveBeenCalledWith(1000000);
  });

  it("콤마가 포함된 입력도 정상적으로 파싱한다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 0, onChange, thousandsSeparator: true })
    );

    act(() => result.current.handleChange("1,000"));
    act(() => result.current.handleChange("1,0001"));

    expect(result.current.text).toBe("10,001");
    expect(onChange).toHaveBeenCalledWith(10001);
  });

  it("allowNegative가 false면 음수 부호를 거부한다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 0, onChange })
    );

    act(() => result.current.handleChange("-3"));

    expect(result.current.text).toBe("0");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("allowNegative가 true면 음수를 입력할 수 있다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({
        value: 0,
        onChange,
        min: -Infinity,
        allowNegative: true,
      })
    );

    act(() => result.current.handleChange("-3"));

    expect(result.current.text).toBe("-3");
    expect(onChange).toHaveBeenCalledWith(-3);
  });

  it("allowNegative가 true여도 '-' 단독 입력 상태에서는 onChange를 호출하지 않는다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({
        value: 0,
        onChange,
        min: -Infinity,
        allowNegative: true,
      })
    );

    act(() => result.current.handleChange("-"));

    expect(result.current.text).toBe("-");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("blur 시 외부 value로 되돌아간다", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useNumericTextInput({ value: 5, onChange })
    );

    act(() => result.current.handleFocus());
    act(() => result.current.handleChange(""));
    expect(result.current.text).toBe("");

    act(() => result.current.handleBlur());
    expect(result.current.text).toBe("5");
  });
});
