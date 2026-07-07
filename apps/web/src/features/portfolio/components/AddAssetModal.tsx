import { X } from "lucide-react";
import type { Asset } from "@portraq/lib/types";
import { StockSearch } from "@/features/stocks/components/StockSearch";

type AddAssetModalProps = {
  onClose: () => void;
  onSelect: (asset: Asset) => void;
};

export function AddAssetModal({ onClose, onSelect }: AddAssetModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[480px] rounded-3xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-extrabold text-foreground">
            종목 추가
          </h3>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={22} />
          </button>
        </div>
        <StockSearch onSelect={onSelect} />
      </div>
    </div>
  );
}
