"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, PieChart } from "lucide-react";
import { usePortfolioList } from "@/features/portfolio/hooks";

type PortfolioNavItemProps = {
  onNavigate?: () => void;
};

export const PortfolioNavItem = ({ onNavigate }: PortfolioNavItemProps) => {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { data: portfolios } = usePortfolioList();

  const active = pathname === "/portfolio" || pathname.startsWith("/portfolio/");

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-[10px] text-sm font-semibold transition-colors ${
          active
            ? "bg-[#eef2ff] text-[#355df9]"
            : "text-[#6b6b7b] hover:bg-[#f4f4f5] hover:text-[#1c1c1e]"
        }`}
      >
        <Link
          href="/portfolio"
          onClick={onNavigate}
          className="flex flex-1 items-center gap-2.5 py-2.5 pl-3.5 pr-1"
        >
          <PieChart size={18} />
          내 포트폴리오
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? "포트폴리오 목록 접기" : "포트폴리오 목록 펼치기"}
          aria-expanded={expanded}
          className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-inherit"
        >
          {expanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>
      </div>

      {expanded && (
        <div className="ml-2 flex flex-col gap-0.5 border-l border-[#f4f4f5] py-1 pl-3">
          {portfolios?.length === 0 && (
            <span className="px-2 py-1.5 text-xs text-muted-foreground">
              저장된 포트폴리오가 없습니다
            </span>
          )}
          {portfolios?.map((item) => (
            <Link
              key={item.id}
              href={`/portfolio/${item.id}`}
              onClick={onNavigate}
              className="truncate rounded-md px-2 py-1.5 text-xs font-semibold text-[#6b6b7b] transition-colors hover:bg-[#f4f4f5] hover:text-[#1c1c1e]"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
