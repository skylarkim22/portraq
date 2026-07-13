"use client";

import { SummaryTiles } from "@/features/home/components/SummaryTiles";
import { PortfolioPreviewSection } from "@/features/home/components/PortfolioPreviewSection";
import { RecentHistorySection } from "@/features/home/components/RecentHistorySection";

export const HomePage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <section className="mb-6">
        <SummaryTiles />
      </section>

      <PortfolioPreviewSection />

      <RecentHistorySection />
    </div>
  );
};
