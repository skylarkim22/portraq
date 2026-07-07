"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/features/auth/hooks";
import { useCreatePortfolio } from "@/features/portfolio/hooks";

const DEFAULT_PORTFOLIO_NAME = "내 포트폴리오";

export function CreatePortfolioRedirect() {
  const router = useRouter();
  const { data: user } = useUser();
  const createPortfolio = useCreatePortfolio();

  useEffect(() => {
    if (user && createPortfolio.isIdle) {
      createPortfolio.mutate(
        { userId: user.id, name: DEFAULT_PORTFOLIO_NAME },
        { onSuccess: (id) => router.replace(`/portfolio/${id}`) }
      );
    }
  }, [user, createPortfolio, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      포트폴리오를 생성하는 중...
    </div>
  );
}
