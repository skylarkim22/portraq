// ETF 분배금 배치들이 공유하는 asset_dividends upsert 헬퍼.
// id(UUID)가 PK라 on_conflict 없이는 merge-duplicates가 PK 기준으로
// 시도돼 항상 새 행으로 취급된다 — 실제 유니크 제약인
// (ticker, record_date)를 명시해야 한다.

export type AssetDividendRow = {
  ticker: string;
  record_date: string;
  pay_date: string | null;
  dividend_reason: string | null;
  amount: number;
  source: string;
};

export const upsertAssetDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  rows,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  rows: AssetDividendRow[];
}) => {
  if (rows.length === 0) return;
  const res = await fetch(`${supabaseUrl}/rest/v1/asset_dividends?on_conflict=ticker,record_date`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`asset_dividends upsert 실패: HTTP ${res.status} ${await res.text()}`);
  }
};
