import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useUser,
  useSignOut,
  useSignInWithOAuth,
} from "@/features/auth/hooks";
import { authKeys } from "@/features/auth/queries";

const mockUser = { id: "user-1", email: "test@example.com" };

const getUserMock = vi.fn();
const signOutMock = vi.fn();
const signInWithOAuthMock = vi.fn();
const onAuthStateChangeMock = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
      signInWithOAuth: signInWithOAuthMock,
      onAuthStateChange: onAuthStateChangeMock,
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

  it("INITIAL_SESSION 이외의 인증 이벤트는 재요청 없이 캐시에 바로 반영한다", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const { result, queryClient } = renderWithClient(() => useUser());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const onAuthStateChange = onAuthStateChangeMock.mock.calls[0][0];
    getUserMock.mockClear();

    act(() => {
      onAuthStateChange("SIGNED_IN", { user: mockUser });
    });

    expect(queryClient.getQueryData(authKeys.user())).toEqual(mockUser);
    expect(getUserMock).not.toHaveBeenCalled();
  });
});

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
