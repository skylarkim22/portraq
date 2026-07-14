import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSignOut, useSignInWithOAuth } from "@/features/auth/mutations";

const signOutMock = vi.fn();
const signInWithOAuthMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: signOutMock,
      signInWithOAuth: signInWithOAuthMock,
    },
  }),
}));

function renderWithClient<T>(callback: () => T) {
  const queryClient = new QueryClient();
  const view = renderHook(callback, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { ...view, queryClient };
}

describe("useSignInWithOAuth", () => {
  beforeEach(() => {
    signInWithOAuthMock.mockReset();
  });

  it("provider를 지정해 signInWithOAuth를 호출한다", async () => {
    signInWithOAuthMock.mockResolvedValue({ error: null });

    const { result } = renderWithClient(() => useSignInWithOAuth());

    await act(async () => {
      await result.current.mutateAsync("kakao");
    });

    expect(signInWithOAuthMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "kakao" })
    );
  });
});

describe("useSignOut", () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

  it("로그아웃을 호출한다", async () => {
    signOutMock.mockResolvedValue({ error: null });

    const { result } = renderWithClient(() => useSignOut());

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(signOutMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
