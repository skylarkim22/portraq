"use client";

import { useEffect } from "react";

const REVEAL_THRESHOLD = 0.1;
const REVEAL_ROOT_MARGIN = "0px 0px -60px 0px";

/**
 * `.reveal` 요소가 뷰포트에 들어오면 `.visible`을 붙여 페이드인시킨다.
 * 랜딩 페이지 전역에 흩어진 요소를 document 기준으로 관찰하므로 렌더링은 없다.
 */
const RevealOnScroll = () => {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        }),
      { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_ROOT_MARGIN },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
};

export default RevealOnScroll;
