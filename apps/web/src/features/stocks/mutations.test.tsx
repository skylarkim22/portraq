import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCreateCustomAsset } from "@/features/stocks/mutations";

const makeBuilder = (result: { data: unknown; error: unknown }) => {
  const builder: Record<string, unknown> = {};
  builder.insert = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  return builder;
};

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

const renderWithClient = <T,>(callback: () => T) => {
  const queryClient = new QueryClient();
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe("useCreateCustomAsset", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("custom_assets에 insert하고 Asset 형태로 isCustom:true를 반환한다", async () => {
    fromMock.mockReturnValue(
      makeBuilder({
        data: { id: "c1", name: "비상장 펀드", market: "KR", color: "#123456" },
        error: null,
      })
    );

    const { result } = renderWithClient(() => useCreateCustomAsset());

    let created;
    await act(async () => {
      created = await result.current.mutateAsync({
        userId: "u1",
        name: "비상장 펀드",
        market: "KR",
      });
    });

    expect(fromMock).toHaveBeenCalledWith("custom_assets");
    expect(created).toEqual({
      ticker: "c1",
      name: "비상장 펀드",
      market: "KR",
      color: "#123456",
      isActive: true,
      dividendFrequency: null,
      dividendMonths: null,
      isCustom: true,
    });
  });
});
