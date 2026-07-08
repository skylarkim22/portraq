import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { PortfolioAsset } from "@portraq/lib/types";
import { AssetRow } from "@/features/portfolio/components/AssetRow";

type AssetListProps = {
  assets: PortfolioAsset[];
  onRatioChange: (ticker: string, ratio: number) => void;
  onRemove: (ticker: string) => void;
  onReorder: (assets: PortfolioAsset[]) => void;
  onFillSlot: (ticker: string) => void;
};

export const AssetList = ({
  assets,
  onRatioChange,
  onRemove,
  onReorder,
  onFillSlot,
}: AssetListProps) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = assets.findIndex((a) => a.ticker === active.id);
    const newIndex = assets.findIndex((a) => a.ticker === over.id);
    onReorder(
      arrayMove(assets, oldIndex, newIndex).map((asset, index) => ({
        ...asset,
        order: index,
      }))
    );
  };

  return (
    <DndContext
      id="portfolio-asset-list"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={assets.map((a) => a.ticker)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {assets.map((asset) => (
            <AssetRow
              key={asset.ticker}
              asset={asset}
              onRatioChange={onRatioChange}
              onRemove={onRemove}
              onFillSlot={onFillSlot}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
