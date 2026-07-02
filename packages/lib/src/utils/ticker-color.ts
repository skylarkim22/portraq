const COLOR_PALETTE = [
  "#355df9", "#e85d4a", "#f5a623", "#2db87a", "#9b59b6",
  "#1abc9c", "#e67e22", "#3498db", "#e74c3c", "#16a085",
  "#8e44ad", "#d35400", "#27ae60", "#2980b9", "#c0392b",
  "#f39c12", "#7f8c8d", "#1a5276", "#6c3483", "#1e8449",
];

export function getTickerColor(ticker: string): string {
  const hash = ticker
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

export function resolveColor(
  existingColor: string | undefined,
  ticker: string,
  usedColors: string[] = []
): string {
  if (existingColor) return existingColor;

  const base = getTickerColor(ticker);
  if (!usedColors.includes(base)) return base;

  const idx = COLOR_PALETTE.indexOf(base);
  for (let i = 1; i < COLOR_PALETTE.length; i++) {
    const candidate = COLOR_PALETTE[(idx + i) % COLOR_PALETTE.length];
    if (!usedColors.includes(candidate)) return candidate;
  }
  return base;
}
