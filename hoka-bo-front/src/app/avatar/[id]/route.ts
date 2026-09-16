import { apiBaseUrl } from "@/lib/api";
import { readTokens } from "@/lib/session";

// 브라우저는 hoka-bo-api를 직접 부르지 못한다(토큰이 HttpOnly 쿠키에 있다).
// 아바타는 <img>가 부르는 주소라 Server Action으로는 못 가져오므로 여기서 중계한다.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return new Response(null, { status: 400 });
  }

  const { accessToken } = await readTokens();
  if (!accessToken) {
    return new Response(null, { status: 401 });
  }

  const upstream = await fetch(`${apiBaseUrl()}/api/users/${id}/avatar`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: request.signal,
  });
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "image/png",
      // 사진이 바뀌면 화면이 붙이는 ?v= 값이 바뀌어 주소 자체가 달라진다. 그래서 오래 캐시해도 된다.
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
