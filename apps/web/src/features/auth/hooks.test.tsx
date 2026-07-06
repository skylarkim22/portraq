import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUser, useSignOut } from "@/features/auth/hooks";

const mockUser = { id: "user-1", email: "test@example.com" };

const getUserMock = vi.fn();
const signOutMock = vi.fn();
const onAuthStateChangeMock = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
  }),
}));

function renderWithClient<T>(callback: () => T) {
  const queryClient = new QueryClient();
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useUser", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    onAuthStateChangeMock.mockClear();
  });

  it("로그인된 사용자를 반환한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: mockUser } });

    const { result } = renderWithClient(() => useUser());

    await waitFor(() => expect(result.current.data).toEqual(mockUser));
  });

  it("비로그인 상태면 null을 반환한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { result } = renderWithClient(() => useUser());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
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
