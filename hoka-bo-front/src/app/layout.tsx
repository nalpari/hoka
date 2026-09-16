import type { Metadata } from "next";

// Tailwind를 먼저 두고 시안 스타일시트를 뒤에 둬서, 겹치는 기본 스타일은 시안이 이긴다.
import "./globals.css";
import "./hoka.css";

export const metadata: Metadata = {
  title: "HOKA 백오피스",
  description: "호카코리아 브랜드스토어 운영 백오피스",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // 다크 토큰도 hoka.css에 있지만 토글 UI는 아직 없어 라이트로 고정한다.
    <html lang="ko" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
