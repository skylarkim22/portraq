import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { Providers } from "@/app/providers";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

const siteUrl = "https://portraq.vercel.app";

export const metadata: Metadata = {
  title: "Portraq — 대가의 전략으로 적립식 투자하기",
  description:
    "워런 버핏, 레이 달리오의 포트폴리오 전략으로 매달 적립하세요. 종목 배분부터 매수 수량까지 자동으로 안내합니다.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Portraq — 대가의 전략으로 적립식 투자하기",
    description:
      "워런 버핏, 레이 달리오의 포트폴리오 전략으로 매달 적립하세요. 종목 배분부터 매수 수량까지 자동으로 안내합니다.",
    siteName: "Portraq",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Portraq — 대가의 전략으로 적립식 투자하기",
    description:
      "워런 버핏, 레이 달리오의 포트폴리오 전략으로 매달 적립하세요. 종목 배분부터 매수 수량까지 자동으로 안내합니다.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-center"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "flex items-center gap-2 rounded-xl bg-[#1c1c1e] px-5 py-3 text-[13px] font-semibold text-white shadow-lg",
            },
          }}
        />
      </body>
    </html>
  );
}
