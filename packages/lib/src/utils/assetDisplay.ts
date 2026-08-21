// 커스텀 종목(isCustom)의 ticker에는 custom_assets.id(UUID)가 그대로 담겨 있어
// 화면에 UUID 전체를 노출하면 안 된다. 첫 '-' 앞부분(UUID의 첫 세그먼트)만 잘라
// 짧은 식별자로 보여준다. 카탈로그 종목은 ticker를 그대로 보여준다.
export const formatAssetTicker = (ticker: string, isCustom?: boolean): string =>
  isCustom ? ticker.split("-")[0] : ticker;
