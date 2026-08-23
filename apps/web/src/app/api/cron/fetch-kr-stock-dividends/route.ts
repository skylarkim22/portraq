import { NextResponse, type NextRequest } from "next/server";
import { fetchKrStockDividends } from "@/features/asset-prices/fetchKrStockDividends";
import { notifyDiscordFailure } from "@/features/asset-prices/notifyDiscordFailure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = async (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // NEXT_PUBLIC_SUPABASE_URL은 비밀이 아니라 클라이언트 번들에도 노출되는 값이라
  // 서버에서도 그대로 재사용한다. service-role 키만 별도 비공개 변수로 유지.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dataGoKrApiKey = process.env.DATA_GO_KR_API_KEY;
  if (!supabaseUrl || !serviceRoleKey || !dataGoKrApiKey) {
    const detail = "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY";
    await notifyDiscordFailure({ title: "❌ KR 배당 배치 실패", description: `환경변수 누락: ${detail}` });
    return NextResponse.json({ ok: false, error: "missing_env", detail }, { status: 500 });
  }

  try {
    const result = await fetchKrStockDividends({ supabaseUrl, serviceRoleKey, dataGoKrApiKey });
    console.log(`[fetch-kr-stock-dividends] ${JSON.stringify(result)}`);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[fetch-kr-stock-dividends] 실패: ${message}`);
    await notifyDiscordFailure({ title: "❌ KR 배당 배치 실패", description: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
