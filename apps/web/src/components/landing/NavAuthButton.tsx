"use client";

import { ArrowRight } from "lucide-react";
import { useUser } from "@/features/auth/hooks";

/**
 * GNB 우측 인증 버튼. 로그인 상태에 따라 로딩 스켈레톤 / 내 포트폴리오 /
 * 시작하기를 노출한다. 네비게이션 렌더링과 인증 상태 관심사를 분리한다.
 */
const NavAuthButton = () => {
  const { data: user, isLoading: isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div
        className="animate-pulse"
        style={{
          width: 76,
          height: 32,
          background: "#e4e4e7",
          borderRadius: 8,
        }}
      />
    );
  }

  if (user) {
    return (
      <a
        href="/home"
        className="btn-ghost"
        style={{ height: 32, padding: "0 14px", fontSize: 12 }}
      >
        내 포트폴리오
      </a>
    );
  }

  return (
    <a
      href="/login"
      className="btn-primary"
      style={{ height: 32, padding: "0 14px", fontSize: 12 }}
    >
      시작하기 <ArrowRight size={14} />
    </a>
  );
};

export default NavAuthButton;
