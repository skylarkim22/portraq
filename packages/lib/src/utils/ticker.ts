const CUSTOM_TICKER_PATTERN = /^CUSTOM_(\d+)$/;

export const generateCustomTicker = (existingTickers: string[]): string => {
  const usedSequences = existingTickers
    .map((ticker) => CUSTOM_TICKER_PATTERN.exec(ticker)?.[1])
    .filter((seq): seq is string => Boolean(seq))
    .map((seq) => parseInt(seq, 10));

  const next = usedSequences.length > 0 ? Math.max(...usedSequences) + 1 : 1;
  return `CUSTOM_${next}`;
};
