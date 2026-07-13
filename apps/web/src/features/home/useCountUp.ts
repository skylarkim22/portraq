import { useEffect, useRef, useState } from "react";

const COUNT_UP_DURATION_MS = 600;

export const useCountUp = (target: number) => {
  const [displayValue, setDisplayValue] = useState(target);
  const displayValueRef = useRef(target);
  const previousTargetRef = useRef(target);

  useEffect(() => {
    const from = previousTargetRef.current;
    const to = target;
    if (from === to) return;

    let frameId: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / COUNT_UP_DURATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      const value = from + (to - from) * eased;
      displayValueRef.current = value;
      setDisplayValue(value);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameId);
      previousTargetRef.current = displayValueRef.current;
    };
  }, [target]);

  return displayValue;
};
