// 파일 경로: src/app/layout.tsx

import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NavBar, Footer, PrivacyBanner } from "@/components/SharedUI";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-VY3CKSDPVV";

export const metadata: Metadata = {
  title: "탐서(探書) - 지식 탐험 나침반",
  description: "가장 아날로그적인 휴식을 위한, 가장 스마트한 연결.",
  verification: {
    google: "mJ1Bujqi5OAxXVmbLEFLQHzxHJ5E69taIXNb0EhQt3g",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-black selection:text-white antialiased" style={{ fontFamily: "'Pretendard', sans-serif" }}>
        <NavBar />
        {children}
        <Footer />
        <PrivacyBanner />
        <GoogleAnalytics gaId={GA_ID} />
      </body>
    </html>
  );
}
