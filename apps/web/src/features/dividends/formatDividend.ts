export const fmtWon = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

export const monthLabel = (monthKey: string) => monthKey.replace("-", ".");
