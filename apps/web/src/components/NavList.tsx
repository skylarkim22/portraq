import Link from "next/link";
import {
  Award,
  History,
  Home,
  NotebookText,
  PieChart,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/portfolio", label: "내 포트폴리오", icon: PieChart },
  { href: "/rebalancing-history", label: "리밸런싱 기록", icon: History },
  { href: "/trade-log", label: "매매 일지", icon: NotebookText },
  { href: "/templates", label: "대가 포트폴리오", icon: Award },
];

const isActive = (pathname: string, href: string) => {
  return pathname === href || pathname.startsWith(`${href}/`);
};

type NavListProps = {
  pathname: string;
  onNavigate?: () => void;
};

export const NavList = ({ pathname, onNavigate }: NavListProps) => {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-[#eef2ff] text-[#355df9]"
                : "text-[#6b6b7b] hover:bg-[#f4f4f5] hover:text-[#1c1c1e]"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};
