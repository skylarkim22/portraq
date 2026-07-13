import type { SupabaseClient } from "@supabase/supabase-js";

// queries.ts의 각 쿼리 정의가 브라우저/서버 어느 쪽에서 prefetch되든 같은
// queryKey를 쓰도록, Supabase 클라이언트를 인자로 주입받을 수 있게 한다.
// 브라우저 클라이언트(client.ts)는 동기, 서버 클라이언트(server.ts)는
// cookies()를 읽어야 해서 비동기이므로 둘 다 허용한다.
export type SupabaseClientGetter = () => SupabaseClient | Promise<SupabaseClient>;
