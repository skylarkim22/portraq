import type { DividendRow } from "@/features/dividends/queries";

const noDataTooltip = (reason: DividendRow["noDataReason"]) => {
  if (reason === "policy") return "이 종목은 배당/분배금을 지급하지 않는 정책입니다.";
  if (reason === "new") return "최근 편입되어 아직 수집된 배당 이력이 없습니다.";
  return "데이터 없음";
};

export const NoData = ({ reason }: { reason: DividendRow["noDataReason"] }) => (
  <span title={noDataTooltip(reason)} className="cursor-help text-[#c1c1c8]">
    -
  </span>
);
