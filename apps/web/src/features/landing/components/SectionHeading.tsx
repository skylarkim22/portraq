import type { CSSProperties, ReactNode } from "react";

type SectionHeadingProps = {
  children: ReactNode;
  /** 어두운 배경 섹션용 변형 (흰색 텍스트 + 넓은 행간) */
  dark?: boolean;
  /** fontSize·marginBottom 등 섹션별 미세 조정 */
  style?: CSSProperties;
};

export const SectionHeading = ({
  children,
  dark,
  style,
}: SectionHeadingProps) => (
  <h2
    style={{
      fontSize: "clamp(2rem,4vw,2.8rem)",
      fontWeight: 800,
      letterSpacing: "-0.04em",
      color: dark ? "#fff" : "var(--ink)",
      lineHeight: dark ? 1.2 : 1.15,
      ...style,
    }}
  >
    {children}
  </h2>
);
