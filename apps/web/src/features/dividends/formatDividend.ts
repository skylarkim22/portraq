export const fmtWon = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

export const monthLabel = (monthKey: string) => monthKey.replace("-", ".");

// "배당일" 헤더 InfoPopover에 쓰는 범례. DividendTable/DividendCardList가
// 공유해서 쓴다.
export const PAY_SCHEDULE_LEGEND =
  "월배당(매월)·분기배당(3·6·9·12월)·반기배당(6·12월)·연배당(12월) 지급을 뜻합니다. 옆 숫자는 실제 지급 이력에서 확인된 월입니다.";
