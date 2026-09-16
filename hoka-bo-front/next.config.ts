import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      // 프로필 사진이 Server Action의 multipart로 간다. 기본 1MB면 10MB를 받겠다는
      // 화면 문구가 지켜지지 않고, 요청이 action 함수에 닿기도 전에 잘린다.
      // 10MB 파일 + multipart 경계·헤더 오버헤드를 덮는 값이다.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
