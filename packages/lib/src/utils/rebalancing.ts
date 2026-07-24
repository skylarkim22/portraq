import type {
  ActionItem,
  ActionType,
  Market,
  PortfolioAsset,
} from "../types/index";

export function toKrwPrice(
  nativePrice: number,
  market: Market,
  exchangeRate: number
): number {
  return market === "US" ? nativePrice * exchangeRate : nativePrice;
}

export interface HoldingInput {
  ticker: string;
  shares: number;
  pricePerShare: number;
}

export interface RebalancingInput {
  assets: PortfolioAsset[];
  holdings: HoldingInput[];
  additionalBudget: number;
  sellThresholdPercent?: number;
}

export interface RebalancingAction {
  ticker: string;
  action: ActionType;
  quantity: number;
  pricePerShare: number;
  currentValue: number;
  targetValue: number;
  currentRatio: number;
  targetRatio: number;
}

const MIN_SHARES = 1;

export function calcRebalancingActions(
  input: RebalancingInput
): RebalancingAction[] {
  const { assets, holdings, additionalBudget, sellThresholdPercent = 0 } =
    input;

  const holdingMap = new Map(
    holdings.map((h) => [h.ticker, h])
  );

  const totalCurrentValue = holdings.reduce(
    (sum, h) => sum + h.shares * h.pricePerShare,
    0
  );
  const totalBudget = totalCurrentValue + additionalBudget;

  const draft = assets
    .filter((a) => !a.isSlot)
    .map((asset) => {
      const holding = holdingMap.get(asset.ticker);
      const price = holding?.pricePerShare ?? 0;
      const currentShares = holding?.shares ?? 0;
      const currentValue = currentShares * price;
      const targetValue = totalBudget * (asset.ratio / 100);
      const diff = targetValue - currentValue;
      const currentRatio =
        totalCurrentValue > 0 ? (currentValue / totalBudget) * 100 : 0;

      const quantityRaw = price > 0 ? Math.abs(diff) / price : 0;

      // 매도는 목표 비율과의 괴리(%p)가 임계값 이상일 때만 발생시킨다.
      // 매수 우선·매도 최소화: 추가 투자금은 저비중 종목 매수로 최대한
      // 활용하고, 소폭 초과 비중은 매도 없이 유지한다.
      const deviation = currentRatio - asset.ratio;

      let action: ActionType = "hold";

      if (diff > 0 && quantityRaw >= MIN_SHARES) {
        action = "buy";
      } else if (
        diff < 0 &&
        quantityRaw >= MIN_SHARES &&
        deviation >= sellThresholdPercent
      ) {
        action = "sell";
      }

      return { asset, price, currentValue, targetValue, diff, currentRatio, action };
    });

  // 임계값 미만이라 매도하지 않는 초과비중 종목의 여윳값은 실제로는
  // 회수되지 않는다. 이 값까지 totalBudget에 포함해 매수 목표를 잡으면
  // 실제 확보 가능한 현금(추가 투자금 + 실제 매도 회수액)보다 매수 지시
  // 총액이 커지는 문제가 있어, 매수만 가용 현금 한도로 비례 축소한다.
  // 매도 회수액은 소수점 목표 diff가 아니라, 정수 주식 수로 내림 처리된
  // 실제 체결 금액 기준이어야 한다. 그렇지 않으면 나눠떨어지지 않는
  // 가격대에서 가용 현금을 과대평가해 같은 유형의 초과매수가 남는다.
  const totalSellProceeds = draft
    .filter((d) => d.action === "sell")
    .reduce(
      (sum, d) => sum + Math.floor(Math.abs(d.diff) / d.price) * d.price,
      0
    );
  const totalBuyDemand = draft
    .filter((d) => d.action === "buy")
    .reduce((sum, d) => sum + d.diff, 0);
  const availableForBuy = additionalBudget + totalSellProceeds;
  const buyScale =
    totalBuyDemand > 0 && totalBuyDemand > availableForBuy
      ? availableForBuy / totalBuyDemand
      : 1;

  return draft.map(
    ({ asset, price, currentValue, targetValue, diff, currentRatio, action }) => {
      const finalDiff = action === "buy" ? diff * buyScale : diff;
      const quantity = price > 0 ? Math.floor(Math.abs(finalDiff) / price) : 0;
      const finalAction = action === "buy" && quantity < MIN_SHARES ? "hold" : action;
      const finalTargetValue =
        finalAction === "buy" ? currentValue + finalDiff : targetValue;

      return {
        ticker: asset.ticker,
        action: finalAction,
        quantity: finalAction === "hold" ? 0 : quantity,
        pricePerShare: price,
        currentValue,
        targetValue: finalTargetValue,
        currentRatio,
        targetRatio: asset.ratio,
      };
    }
  );
}

export function toActionItems(actions: RebalancingAction[]): ActionItem[] {
  return actions.map((a) => {
    const quantity = a.action === "sell" ? -a.quantity : a.quantity;
    return {
      ticker: a.ticker,
      action: a.action,
      quantity,
      pricePerShare: a.pricePerShare,
    };
  });
}
