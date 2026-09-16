// 서버·클라이언트 양쪽에서 쓰는 표시 헬퍼. 시간대를 Asia/Seoul로 고정해야
// 서버 렌더와 브라우저 렌더가 같은 문자열을 내고 하이드레이션이 어긋나지 않는다.
const ZONE = "Asia/Seoul";

const STAMP = new Intl.DateTimeFormat("ko-KR", {
  timeZone: ZONE,
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DAY = new Intl.DateTimeFormat("sv-SE", { timeZone: ZONE });

/** "09-15 10:31" */
export function stamp(value: string | null | undefined) {
  if (!value) return null;
  const parts = STAMP.formatToParts(new Date(value));
  const at = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${at("month")}-${at("day")} ${at("hour")}:${at("minute")}`;
}

/** "2025-11-03" */
export function day(value: string | null | undefined) {
  return value ? DAY.format(new Date(value)) : null;
}

export function daysSince(value: string | null | undefined) {
  if (!value) return null;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

// 로그인 이력에는 UA 원문만 남는다. 목록에 쓸 이름만 뽑는다.
export function browserOf(userAgent: string | null | undefined) {
  if (!userAgent) return "알 수 없음";
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("OPR/")) return "Opera";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Safari/")) return "Safari";
  return "기타";
}
