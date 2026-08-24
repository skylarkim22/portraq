import { Info } from "lucide-react";

type InfoTooltipProps = {
  text: string;
};

// 라벨 옆에 ⓘ 아이콘을 붙여 "여기 hover하면 설명이 나온다"는 걸
// 시각적으로 드러낸다. 라벨 텍스트 자체에 title을 숨겨두면 마우스를
// 어디에 올려야 하는지 알기 어렵다(#75 피드백).
export const InfoTooltip = ({ text }: InfoTooltipProps) => (
  <span title={text} className="inline-flex cursor-help items-center align-middle text-[#9ca3af] hover:text-[#6b6b7b]">
    <Info size={12} />
  </span>
);
