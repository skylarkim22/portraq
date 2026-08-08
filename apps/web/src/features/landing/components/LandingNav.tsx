import Logo from "@/components/Logo";
import { NavAuthButton } from "@/features/landing/components/NavAuthButton";

const navLinks = [
  { href: "#features", label: "기능" },
  { href: "#portfolios", label: "대가 포트폴리오" },
  { href: "#howto", label: "사용법" },
];

export const LandingNav = () => (
  <header className="nav-glass sticky top-0 z-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <Logo size="sm" />
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={label}
              href={href}
              className="no-underline font-semibold text-sm text-[var(--ink-soft)] px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-[#f9fafb] hover:text-[#111827]"
            >
              {label}
            </a>
          ))}
        </nav>
        <NavAuthButton />
      </div>
    </div>
  </header>
);

