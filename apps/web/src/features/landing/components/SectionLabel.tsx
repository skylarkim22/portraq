import type { CSSProperties, ReactNode } from "react";

type SectionLabelProps = {
  icon: ReactNode;
  children: ReactNode;
  /** 어두운 배경 섹션용 변형 */
  dark?: boolean;
  style?: CSSProperties;
};

const DARK_STYLE: CSSProperties = {
  background: "rgba(53,93,249,0.2)",
  color: "#8fa8fb",
};

export const SectionLabel = ({
  icon,
  children,
  dark,
  style,
}: SectionLabelProps) => (
  <span
    className="section-label"
    style={{
      display: "inline-flex",
      marginBottom: 16,
      ...(dark ? DARK_STYLE : {}),
      ...style,
    }}
  >
    {icon} {children}
  </span>
);
