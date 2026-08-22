import { NextResponse, type NextRequest } from "next/server";
import { fetchKrClosingPrices } from "@/features/asset-prices/fetchKrClosingPrices";

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
    return NextResponse.json(
      {
        ok: false,
        error: "missing_env",
        detail: "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY",
      },
      { status: 500 }
    );
  }

  try {
    const { result, warnings } = await fetchKrClosingPrices({ supabaseUrl, serviceRoleKey, dataGoKrApiKey });
    for (const warning of warnings) console.warn(`[fetch-kr-closing-prices] ${warning}`);
    console.log(`[fetch-kr-closing-prices] ${JSON.stringify(result)}`);
    return NextResponse.json({ ok: true, result, warnings });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[fetch-kr-closing-prices] 실패: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
