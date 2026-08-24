"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useDividends } from "@/features/dividends/hooks";
import { deriveDividendSummary } from "@/features/dividends/deriveDividendSummary";
import { DividendInfoBanner } from "@/features/dividends/components/DividendInfoBanner";
import { DividendPortfolioFilter, ALL_PORTFOLIOS } from "@/features/dividends/components/DividendPortfolioFilter";
import { DividendSummaryCards } from "@/features/dividends/components/DividendSummaryCards";
import { DividendTable } from "@/features/dividends/components/DividendTable";
import { DividendCardList } from "@/features/dividends/components/DividendCardList";
import { DividendInputModal } from "@/features/dividends/components/DividendInputModal";
import type { DividendRow } from "@/features/dividends/queries";

// 수정 대상 종목은 (portfolioId, ticker) 키로만 들고 있다가 매 렌더마다
// allRows에서 다시 찾아 쓴다 — DividendRow 객체 자체를 상태로 들고 있으면
// 삭제/저장으로 캐시가 갱신돼도 모달이 클릭 시점의 스냅샷을 계속 보여준다.
type EditingKey = { portfolioId: string; ticker: string };

export const DividendsPage = () => {
  const { data: rows, isLoading, isError } = useDividends();
  const [portfolioFilter, setPortfolioFilter] = useState(ALL_PORTFOLIOS);
  const [editingKey, setEditingKey] = useState<EditingKey | null>(null);

  const allRows = rows ?? [];
  const filteredRows =
    portfolioFilter === ALL_PORTFOLIOS ? allRows : allRows.filter((row) => row.portfolioId === portfolioFilter);
  const summary = deriveDividendSummary(filteredRows);

  const editingRow: DividendRow | null = editingKey
    ? (allRows.find((row) => row.portfolioId === editingKey.portfolioId && row.ticker === editingKey.ticker) ?? null)
    : null;

  const handleEditRow = (row: DividendRow) => setEditingKey({ portfolioId: row.portfolioId, ticker: row.ticker });

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-5">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-foreground">분배금 관리</h1>
        <p className="text-sm text-muted-foreground">
          보유 종목의 평균 매수 단가와 최근 12개월 배당(분배)금을 한눈에 확인하세요. 평균 매수 단가는
          리밸런싱 실행 기록을 이동평균법으로 계산합니다.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

      {isError && (
        <p className="text-sm text-destructive">분배금 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
      )}

      {!isLoading && !isError && allRows.length === 0 && (
        <div className="rounded-3xl border border-[#ebebef] bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff]">
            <PlusCircle size={26} className="text-[#355df9]" />
          </div>
          <div className="mb-1.5 text-[15px] font-extrabold text-[#1c1c1e]">아직 보유 중인 종목이 없습니다</div>
          <div className="mb-5 text-[13px] leading-relaxed text-[#6b6b7b]">
            포트폴리오를 만들고 리밸런싱을 한 번 실행하면
            <br />이 화면에서 종목별 배당 정보를 확인할 수 있어요.
          </div>
        </div>
      )}

      {!isLoading && !isError && allRows.length > 0 && (
        <>
          <div className="mb-5">
            <DividendInfoBanner />
          </div>

          <div className="mb-5">
            <DividendPortfolioFilter value={portfolioFilter} onChange={setPortfolioFilter} />
          </div>

          <div className="mb-6">
            <DividendSummaryCards summary={summary} />
          </div>

          <div className="mb-3">
            <DividendTable
              rows={filteredRows}
              grouped={portfolioFilter === ALL_PORTFOLIOS}
              onEditRow={handleEditRow}
            />
          </div>
          <DividendCardList
            rows={filteredRows}
            grouped={portfolioFilter === ALL_PORTFOLIOS}
            onEditRow={handleEditRow}
          />
        </>
      )}

      {editingRow && <DividendInputModal row={editingRow} onClose={() => setEditingKey(null)} />}
    </div>
  );
};
