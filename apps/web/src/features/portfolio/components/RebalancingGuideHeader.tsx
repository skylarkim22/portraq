type RebalancingGuideHeaderProps = {
  portfolioName?: string;
};

export const RebalancingGuideHeader = ({
  portfolioName,
}: RebalancingGuideHeaderProps) => {
  return (
    <div className="mb-6">
      <span className="section-label mb-3 inline-flex">리밸런싱 가이드</span>
      <h1 className="mb-1.5 text-2xl font-extrabold tracking-tight text-foreground">
        {portfolioName} 리밸런싱
      </h1>
      <p className="text-sm text-muted-foreground">
        3단계로 이번 달 매수·매도 액션을 확인하세요.
      </p>
    </div>
  );
};
