import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const ASSET_PRICES_CACHE_TAG = "asset-prices";
// 안전망 TTL — 실제 무효화는 종가 배치가 끝나고 revalidateTag로 즉시 수행한다.
const ASSET_PRICES_CACHE_REVALIDATE_SECONDS = 60 * 60 * 6;

// asset_prices는 RLS상 누구나 읽을 수 있는 공개 데이터라 사용자 세션이
// 필요 없다. lib/supabase/server.ts의 쿠키 기반 클라이언트 대신 anon key로
// 만든 전용 클라이언트에 next.tags를 태워 Next.js Data Cache에 캐싱한다(#86).
let client: ReturnType<typeof createClient> | undefined;

export const getCachedAssetPriceClient = () => {
  if (!client) {
    const { url, anonKey } = getSupabaseEnv();
    client = createClient(url, anonKey, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            next: {
              tags: [ASSET_PRICES_CACHE_TAG],
              revalidate: ASSET_PRICES_CACHE_REVALIDATE_SECONDS,
            },
          }),
      },
    });
  }
  return client;
};
