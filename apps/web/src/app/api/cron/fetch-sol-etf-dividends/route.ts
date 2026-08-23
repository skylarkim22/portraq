import { NextResponse, type NextRequest } from "next/server";
import { fetchSolEtfDividends } from "@/features/asset-prices/fetchSolEtfDividends";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    const detail = "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY";
    await notifyDiscordFailure({ title: "❌ SOL ETF 분배금 배치 실패", description: `환경변수 누락: ${detail}` });
    return NextResponse.json({ ok: false, error: "missing_env", detail }, { status: 500 });
  }

  try {
    const result = await fetchSolEtfDividends({ supabaseUrl, serviceRoleKey });
    console.log(`[fetch-sol-etf-dividends] ${JSON.stringify(result)}`);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[fetch-sol-etf-dividends] 실패: ${message}`);
    await notifyDiscordFailure({ title: "❌ SOL ETF 분배금 배치 실패", description: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
