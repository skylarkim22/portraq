type RebalancingStepTabsProps = {
  step: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
};

const STEPS: { step: 1 | 2 | 3; label: string }[] = [
  { step: 1, label: "보유 주수 입력" },
  { step: 2, label: "투자금 설정" },
  { step: 3, label: "액션 확인" },
];

export const RebalancingStepTabs = ({
  step,
  onStepChange,
}: RebalancingStepTabsProps) => {
  return (
    <div className="flex border-b border-border">
      {STEPS.map(({ step: s, label }) => {
        const isActive = s === step;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onStepChange(s)}
            className={`relative flex-1 py-2.5 text-center text-sm font-bold transition-colors ${
              isActive
                ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                : "text-muted-foreground"
            }`}
          >
            <span className="mb-0.5 block text-[10px] opacity-70">
              STEP {s}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
};
