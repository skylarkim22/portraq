// ETF 분배금 배치들이 공유하는 헬퍼. 운용사가 공개하는 분배 데이터는
// "보유 중인 티커"가 아니라 "우리 카탈로그(assets)에 있는 KR 티커" 전체를
// 대상으로 저장한다(#75/#76) — 신규로 담는 종목도 배치를 기다리지 않고
// 바로 이력이 있도록 하기 위함. 다만 assets에 없는 티커를 저장하려 하면
// asset_dividends.ticker FK 위반이 나므로, 실제 카탈로그에 존재하는
// 티커인지는 반드시 걸러야 한다.

// PostgREST(Supabase)는 db-max-rows 설정으로 한 응답당 최대 1000행까지만
// 준다 — Range 헤더로 0-9999를 요청해도 서버가 1000으로 잘라버린다.
// KR assets가 4천 개 가까이 되므로 Range를 페이지 단위로 옮겨가며
// 전부 모을 때까지 반복 조회한다.
const PAGE_SIZE = 1000;

export const fetchValidKrTickers = async ({
  supabaseUrl,
  serviceRoleKey,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
}) => {
  const tickers = new Set<string>();
  let offset = 0;
  for (;;) {
    const url = `${supabaseUrl}/rest/v1/assets?select=ticker&market=eq.KR`;
    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) {
      throw new Error(`assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
    }
    const rows = (await res.json()) as { ticker: string }[];
    for (const row of rows) tickers.add(row.ticker);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return tickers;
};

// 종목명만 제공하는 소스(TIGER 등)를 위한 역방향 맵(이름 → 티커).
export const fetchKrNameToTicker = async ({
  supabaseUrl,
  serviceRoleKey,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
}) => {
  const map = new Map<string, string>();
  let offset = 0;
  for (;;) {
    const url = `${supabaseUrl}/rest/v1/assets?select=ticker,name&market=eq.KR`;
    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) {
      throw new Error(`assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
    }
    const rows = (await res.json()) as { ticker: string; name: string }[];
    for (const row of rows) map.set(row.name.trim(), row.ticker);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return map;
};
