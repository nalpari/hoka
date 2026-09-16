import { redirect } from "next/navigation";

// 백오피스의 첫 화면은 대시보드다. 루트는 그쪽으로 넘긴다.
export default function HomePage() {
  redirect("/dashboard");
}
