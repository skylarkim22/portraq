export const dynamic = "force-dynamic";

export const GET = async () => {
  const url =
    "https://apis.data.go.kr/1160100/service/GetSecuritiesProductInfoService/getETFPriceInfo?serviceKey=dummy&numOfRows=1&pageNo=1&resultType=json&basDt=20260820";

  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const body = await res.text();
    return Response.json({ ok: true, status: res.status, elapsedMs: Date.now() - start, body: body.slice(0, 500) });
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; message?: string } };
    return Response.json({
      ok: false,
      elapsedMs: Date.now() - start,
      message: err.message,
      cause: err.cause?.code ?? err.cause?.message ?? String(err.cause),
    });
  }
};
