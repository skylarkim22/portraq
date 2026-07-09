import { CirclePlus, CircleMinus } from "lucide-react";
import { Button } from "@portraq/ui";

type TradeActionBarProps = {
  onOpenBuy: () => void;
  onOpenSell: () => void;
};

export const TradeActionBar = ({ onOpenBuy, onOpenSell }: TradeActionBarProps) => {
  return (
    <>
      {/* 모바일: 하단 고정 전체 폭 바 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button
            type="button"
            className="h-12 flex-1 gap-2 bg-buy hover:bg-buy/90"
            onClick={onOpenBuy}
          >
            <CirclePlus size={17} />
            매수 기록
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-12 flex-1 gap-2"
            onClick={onOpenSell}
          >
            <CircleMinus size={17} />
            매도 기록
          </Button>
        </div>
      </div>

      {/* 데스크톱: 우측 하단 플로팅 버튼 */}
      <div className="fixed bottom-6 right-6 z-40 hidden flex-col gap-3 md:flex">
        <Button
          type="button"
          className="h-12 gap-2 rounded-full bg-buy px-5 shadow-lg hover:bg-buy/90"
          onClick={onOpenBuy}
        >
          <CirclePlus size={17} />
          매수 기록
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-12 gap-2 rounded-full px-5 shadow-lg"
          onClick={onOpenSell}
        >
          <CircleMinus size={17} />
          매도 기록
        </Button>
      </div>
    </>
  );
};
