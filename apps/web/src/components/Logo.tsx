import { Carter_One } from "next/font/google";
import Link from "next/link";
import LogoSymbol from "@/components/icons/LogoSymbol";

const carterOne = Carter_One({ weight: "400", subsets: ["latin"] });

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
}

const sizeMap = {
  sm: { icon: 28, text: 16 },
  md: { icon: 32, text: 18 },
  lg: { icon: 36, text: 20 },
  xl: { icon: 48, text: 28 },
};

export default function Logo({ size = "md", href = "/" }: LogoProps) {
  const s = sizeMap[size];

  const content = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <LogoSymbol size={s.icon} />
      <span
        className={carterOne.className}
        style={{ fontSize: s.text, color: "#1C1C1E" }}
      >
        Portraq
      </span>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}
