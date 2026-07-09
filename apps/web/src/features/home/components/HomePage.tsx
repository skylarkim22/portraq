"use client";

import { useUser } from "@/features/auth/hooks";
import { SummaryTiles } from "@/features/home/components/SummaryTiles";
import { PortfolioPreviewSection } from "@/features/home/components/PortfolioPreviewSection";
import { RecentHistorySection } from "@/features/home/components/RecentHistorySection";

export const HomePage = () => {
  const { data: user } = useUser();

  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "사용자";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <section className="mb-6">
        <h1 className="mb-4 text-xl font-extrabold tracking-tight text-foreground">
          안녕하세요, {name}님
        </h1>
        <SummaryTiles />
      </section>

      <PortfolioPreviewSection />

      <RecentHistorySection />
    </div>
  );
};
