import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url =
    "https://apis.data.go.kr/1160100/service/GetSecuritiesProductInfoService/getETFPriceInfo?serviceKey=dummy&numOfRows=1&pageNo=1&resultType=json&basDt=20260820";

  const start = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const body = await res.text();
    return NextResponse.json({ ok: true, status: res.status, elapsedMs: Date.now() - start, body: body.slice(0, 500) });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      elapsedMs: Date.now() - start,
      name: e instanceof Error ? e.name : typeof e,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
  }
}
