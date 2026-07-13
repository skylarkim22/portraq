import { QueryClient, isServer } from "@tanstack/react-query";

// SSR에서는 요청마다 응답이 섞이면 안 되므로 항상 새 QueryClient를 만든다.
// 브라우저에서는 최초 렌더링 중 suspend가 발생해도 클라이언트가 버려지지
// 않도록 싱글턴을 재사용한다.
const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // 서버에서 프리페치한 데이터를 hydrate 직후 곧바로 다시 조회하지
        // 않도록 기본 staleTime을 0보다 크게 둔다.
        staleTime: 60 * 1000,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
};
