"use client";

import { useEffect, useRef, useState } from "react";

const COUNT_UP_DURATION_MS = 600;

export const useCountUp = (target: number) => {
  const [displayValue, setDisplayValue] = useState(target);
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
      setDisplayValue(from + (to - from) * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        previousTargetRef.current = to;
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return displayValue;
};
