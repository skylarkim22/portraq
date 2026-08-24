import { Info, Pencil } from "lucide-react";

export const DividendInfoBanner = () => (
  <div className="flex items-start gap-3 rounded-2xl border border-[#c7d5fd] bg-[#eff6ff] px-[18px] py-4">
    <Info size={20} className="mt-px shrink-0 text-[#355df9]" />
    <div>
      <div className="mb-[3px] text-[13px] font-extrabold text-[#1d4ed8]">
        배당금은 직접 입력해야 정확합니다
      </div>
      <div className="text-xs leading-relaxed text-[#3b4a8f]">
        배당합·연환산수익률은 각 종목의 <Pencil size={11} className="inline align-[-1px]" /> 버튼으로 직접
        입력한 값만 반영합니다. 입력하지 않은 종목은 0으로 표시됩니다.
      </div>
    </div>
  </div>
);
