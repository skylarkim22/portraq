import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Award, History, Home, NotebookText } from "lucide-react";
import { PortfolioNavItem } from "@/components/PortfolioNavItem";

const NAV_ITEMS_BEFORE = [{ href: "/home", label: "홈", icon: Home }];

const NAV_ITEMS_AFTER = [
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

type NavLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
};

const NavLink = ({ href, label, icon: Icon, active, onNavigate }: NavLinkProps) => (
  <Link
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

export const NavList = ({ pathname, onNavigate }: NavListProps) => {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS_BEFORE.map(({ href, label, icon }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          icon={icon}
          active={isActive(pathname, href)}
          onNavigate={onNavigate}
        />
      ))}

      <PortfolioNavItem onNavigate={onNavigate} />

      {NAV_ITEMS_AFTER.map(({ href, label, icon }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          icon={icon}
          active={isActive(pathname, href)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
};
