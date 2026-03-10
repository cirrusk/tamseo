// 파일 경로: src/app/layout.tsx

import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { NavBar, Footer, PrivacyBanner } from "@/components/SharedUI";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-VY3CKSDPVV";
const GOOGLE_SITE_VERIFICATION = "mJ1Bujqi5OAxXVmbLEFLQHzxHJ5E69taIXNb0EhQt3g";

export const metadata: Metadata = {
  metadataBase: new URL("https://tamseo.firstapp.kr"),
  title: {
    default: "탐서(Tamseo) - 우리 동네 도서관 통합 검색 & 대출 나침반",
    template: "%s | 탐서(Tamseo)",
  },
  description:
    "수십 곳의 서울시 도서관을 한 번에 검색하세요. 파친코, 어린이 전집 등 원하는 책이 가장 많이 있는 근처 도서관을 즉시 찾아줍니다. 엄마들의 시간을 아껴주는 지식 탐험 나침반, 탐서.",
  keywords: [
    "도서관",
    "서울시 도서관",
    "책 검색",
    "도서 대출",
    "전집 대여",
    "어린이 도서관",
    "베스트셀러 대여",
    "도서관 정보나루",
    "탐서",
    "Tamseo",
    "스마트 도서관",
    "독서",
    "독서국가",
    "독서 문화",
    "책 읽는 대한민국",
  ],
  authors: [{ name: "Tamseo Team", url: "https://tamseo.firstapp.kr" }],
  openGraph: {
    title: "탐서(Tamseo) - 가장 스마트한 도서관 통합 검색",
    description:
      "수십 곳의 서울시 도서관을 한 번에 검색하세요. 파친코, 어린이 전집 등 원하는 책이 가장 많이 있는 근처 도서관을 즉시 찾아줍니다. 엄마들의 시간을 아껴주는 지식 탐험 나침반, 탐서.",
    url: "https://tamseo.firstapp.kr",
    siteName: "탐서(Tamseo)",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "탐서 서비스 소개 이미지",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
        <meta name="naver-site-verification" content="d931f3ea3f8c559e011ba8ff1703885fddde922b" />
      </head>
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
