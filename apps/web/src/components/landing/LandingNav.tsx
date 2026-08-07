"use client";

import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useUser } from "@/features/auth/hooks";

const navLinks = [
  { href: "#features", label: "기능" },
  { href: "#portfolios", label: "대가 포트폴리오" },
  { href: "#howto", label: "사용법" },
];

const LandingNav = () => {
  const { data: user, isLoading: isUserLoading } = useUser();

  return (
    <header className="nav-glass sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <a
                key={label}
                href={href}
                style={{
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#4b5563",
                  padding: "8px 16px",
                  borderRadius: 8,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "#4b5563";
                }}
              >
                {label}
              </a>
            ))}
          </nav>
          {isUserLoading ? (
            <div
              className="animate-pulse"
              style={{
                width: 76,
                height: 32,
                background: "#e4e4e7",
                borderRadius: 8,
              }}
            />
          ) : user ? (
            <a
              href="/home"
              className="btn-ghost"
              style={{ height: 32, padding: "0 14px", fontSize: 12 }}
            >
              내 포트폴리오
            </a>
          ) : (
            <a
              href="/login"
              className="btn-primary"
              style={{ height: 32, padding: "0 14px", fontSize: 12 }}
            >
              시작하기 <ArrowRight size={14} />
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
