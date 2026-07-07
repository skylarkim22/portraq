"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@portraq/ui";
import Logo from "@/components/Logo";
import { NavList } from "@/components/NavList";
import { UserFooter } from "@/components/UserFooter";
import { useSignOut, useUser } from "@/features/auth/hooks";

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useUser();
  const signOut = useSignOut();
  const [mobileOpen, setMobileOpen] = useState(false);

  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "사용자";
  const email = user?.email ?? "";
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = () => {
    signOut.mutate(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#ebebef] bg-white md:flex">
        <div className="border-b border-[#f4f4f5] px-5 py-4">
          <Logo size="sm" href="/" />
        </div>
        <NavList pathname={pathname} />
        <UserFooter
          name={name}
          email={email}
          initial={initial}
          onLogout={handleLogout}
          disabled={signOut.isPending}
        />
      </aside>

      <header className="nav-glass sticky top-0 z-40 flex h-16 items-center justify-between px-4 md:hidden">
        <Logo size="sm" href="/" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="메뉴 열기"
          className="h-9 w-9 text-[#1c1c1e]"
        >
          <Menu size={22} />
        </Button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[260px] flex-col bg-white shadow-2xl">
            <div className="flex justify-end px-4 pt-4 pb-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="메뉴 닫기"
                className="h-8 w-8 text-[#9ca3af]"
              >
                <X size={22} />
              </Button>
            </div>
            <NavList
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
            <UserFooter
              name={name}
              email={email}
              initial={initial}
              onLogout={handleLogout}
              disabled={signOut.isPending}
            />
          </div>
        </div>
      )}
    </>
  );
};
