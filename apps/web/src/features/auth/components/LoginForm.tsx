"use client";

import { Button, Card } from "@portraq/ui";
import { useSignInWithOAuth } from "@/features/auth/hooks";

export function LoginForm() {
  const signIn = useSignInWithOAuth();

  return (
    <Card className="fade-in w-full max-w-[400px] rounded-3xl px-8 py-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
      <div className="mb-8 text-center">
        <div className="mb-2 text-[22px] font-extrabold tracking-tight text-foreground">
          시작하기
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          계정이 없으면 자동으로 가입됩니다
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-center gap-2.5 rounded-[10px] py-3.5 text-[15px] font-bold"
          disabled={signIn.isPending}
          onClick={() => signIn.mutate("google")}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M47.532 24.552a28.79 28.79 0 0 0-.457-5.127H24.48v9.697h13.002c-.56 3.02-2.26 5.58-4.82 7.293v6.065h7.8c4.562-4.2 7.07-10.38 7.07-17.928z" fill="#4285f4" />
            <path d="M24.48 48.001c6.528 0 12.005-2.163 16.006-5.86l-7.8-6.065c-2.163 1.448-4.928 2.301-8.206 2.301-6.312 0-11.658-4.263-13.57-9.993H2.826v6.263C6.813 42.72 15.099 48 24.48 48z" fill="#34a853" />
            <path d="M10.91 28.384a14.4 14.4 0 0 1-.749-4.607c0-1.6.274-3.152.749-4.607v-6.263H2.826A24.047 24.047 0 0 0 .48 24c0 3.877.928 7.55 2.57 10.647l8.04-6.263z" fill="#fbbc04" />
            <path d="M24.48 9.498c3.556 0 6.748 1.223 9.263 3.624l6.946-6.946C36.482 2.358 31.008 0 24.48 0 15.1 0 6.813 5.28 2.826 13.117l8.084 6.262c1.912-5.73 7.258-9.881 13.57-9.881z" fill="#ea4335" />
          </svg>
          Google로 계속하기
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-center gap-2.5 rounded-[10px] border-[#FEE500] bg-[#FEE500] py-3.5 text-[15px] font-bold text-[#191919] hover:bg-[#FEE500]/90 hover:text-[#191919]"
          disabled={signIn.isPending}
          onClick={() => signIn.mutate("kakao")}
        >
          <svg width="20" height="20" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M30 4C14.536 4 2 13.818 2 26c0 7.9 5.215 14.804 13.064 18.762L12.25 56.25a1 1 0 0 0 1.476 1.14L26.48 49.72C27.636 49.906 28.808 50 30 50c15.464 0 28-9.818 28-22S45.464 4 30 4z"
              fill="#191919"
            />
          </svg>
          카카오로 계속하기
        </Button>
      </div>

      {signIn.isError && (
        <p className="mt-4 text-center text-xs text-destructive">
          로그인 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        계속하면 Portraq의{" "}
        <a href="#" className="underline underline-offset-2">
          이용약관
        </a>{" "}
        및{" "}
        <a href="#" className="underline underline-offset-2">
          개인정보처리방침
        </a>
        에 동의하는 것으로 간주됩니다.
      </p>
    </Card>
  );
}
