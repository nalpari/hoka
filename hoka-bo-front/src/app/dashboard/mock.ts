// 시안(ref/design/dashboard.html)의 합성 데이터를 그대로 옮겼다.
// 화면 모양을 확인하기 위한 값이며, 실제 집계는 API가 생기면 교체한다.

export const FIGURES = [
  { label: "오늘 매출", value: "48,216,000", unit: "원", delta: "12.4%", up: true },
  { label: "9월 누계", value: "612,480,000", unit: "원", delta: "8.1%", up: true },
  { label: "주문 건수", value: "3,236", unit: "건", delta: "9.7%", up: true },
  { label: "객단가", value: "189,300", unit: "원", delta: "2.1%", up: false },
];

export const SALES_CHART = {
  values: [3812, 3540, 3388, 4102, 4460, 5210, 4988, 3720, 3655, 3910, 4088, 4210, 4735, 4390, 4822],
  compare: [3540, 3310, 3160, 3810, 4120, 4790, 4610, 3450, 3390, 3620, 3780, 3900, 4380, 4060, 4210],
  labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
  todayIndex: 14,
  labelEvery: 2,
  suffix: "만",
};

export const CATEGORY_SHARE = [
  { name: "로드 러닝", width: 58, share: "58.2%" },
  { name: "트레일", width: 18, share: "17.6%" },
  { name: "라이프스타일·워킹", width: 12, share: "12.4%" },
  { name: "의류·액세서리", width: 8, share: "7.9%" },
  { name: "리커버리", width: 4, share: "3.9%" },
];

export const TOP_PRODUCTS = [
  { name: "클리프톤 10", meta: "로드 · 169,000원", sold: "412족", image: "/shoe-clifton.webp" },
  { name: "본디 9", meta: "로드 · 209,000원", sold: "286족", image: "/shoe-bondi.webp" },
  { name: "스피드고트 6", meta: "트레일 · 189,000원", sold: "173족", image: "/shoe-speedgoat.webp" },
  { name: "마하 6", meta: "로드 · 179,000원", sold: "151족", image: "/shoe-mach.webp" },
  { name: "아라히 8", meta: "로드 · 169,000원", sold: "98족", image: "/shoe-arahi.webp" },
];

type QueueTone = "risk" | "warn" | "accent";

export const QUEUE: {
  icon: "truck" | "ruler" | "message" | "undo" | "star" | "tag" | "wallet" | "box";
  tone: QueueTone;
  title: string;
  meta: string;
  badge: string;
  badgeTone?: QueueTone;
}[] = [
  {
    icon: "truck",
    tone: "risk",
    title: "출고 기한 임박 주문 27건",
    meta: "상품준비중 · 오늘 17:00 마감",
    badge: "6시간",
    badgeTone: "risk",
  },
  {
    icon: "ruler",
    tone: "risk",
    title: "품절 임박 사이즈 9개",
    meta: "본디 9 280 외 · 10족 미만",
    badge: "발주",
    badgeTone: "risk",
  },
  {
    icon: "message",
    tone: "warn",
    title: "미답변 문의 14건",
    meta: "가장 오래된 것 어제 15:20 · 응답 기한 24시간",
    badge: "오늘",
    badgeTone: "warn",
  },
  {
    icon: "undo",
    tone: "warn",
    title: "반품·교환 승인 대기 6건",
    meta: "사이즈 교환 4 · 단순 변심 2",
    badge: "D+2",
    badgeTone: "warn",
  },
  { icon: "star", tone: "warn", title: "신고된 리뷰 2건 검토", meta: "클리프톤 10 · 광고성 의심", badge: "D-1" },
  {
    icon: "tag",
    tone: "accent",
    title: "추석 러닝 기획전 종료 예정",
    meta: "09-22 종료 · 쿠폰 1,240장 남음",
    badge: "D-7",
    badgeTone: "accent",
  },
  {
    icon: "wallet",
    tone: "accent",
    title: "8월 정산 확정 대기",
    meta: "네이버페이 정산 09-20 · 최민지",
    badge: "확인",
    badgeTone: "accent",
  },
  {
    icon: "box",
    tone: "accent",
    title: "신규 상품 등록 승인 2건",
    meta: "스카이워드 X 2 · 정하람 요청",
    badge: "승인",
    badgeTone: "accent",
  },
];

export const SIZES = ["240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290", "295", "300"];

// 숫자는 재고, "품절"은 0족, null은 취급하지 않는 사이즈다.
export const STOCK: {
  name: string;
  meta: string;
  image: string;
  cells: (number | "품절" | null)[];
  total: string;
}[] = [
  {
    name: "클리프톤 10",
    meta: "화이트/코발트 · 7일 판매 118",
    image: "/shoe-clifton.webp",
    cells: [62, 48, 91, 77, 120, 104, 8, 36, 52, 41, 27, 19, null],
    total: "685",
  },
  {
    name: "본디 9",
    meta: "블랙/화이트 · 7일 판매 84",
    image: "/shoe-bondi.webp",
    cells: [33, 29, 58, 44, 71, 6, 39, 22, "품절", 4, 18, 12, 7],
    total: "343",
  },
  {
    name: "스피드고트 6",
    meta: "올리브/오렌지 · 7일 판매 51",
    image: "/shoe-speedgoat.webp",
    cells: [null, 14, 31, 27, 46, 38, 52, 30, 25, 9, 11, null, null],
    total: "283",
  },
  {
    name: "마하 6",
    meta: "코랄/옐로 · 7일 판매 44",
    image: "/shoe-mach.webp",
    cells: [21, 17, 40, 5, 63, 49, 57, "품절", 28, 16, 13, null, null],
    total: "309",
  },
  {
    name: "아라히 8",
    meta: "네이비/스카이 · 7일 판매 29",
    image: "/shoe-arahi.webp",
    cells: [18, 12, 34, 26, 45, 37, 41, 23, 3, 15, "품절", 6, null],
    total: "260",
  },
];

export const ORDER_FLOW = [
  { step: "결제완료", count: "312", note: "발주 확인 전" },
  { step: "상품준비중", count: "184", note: "27건 오늘 17:00 마감", risk: true },
  { step: "배송중", count: "527", note: "평균 1.8일" },
  { step: "배송완료", count: "1,203", note: "구매확정 대기" },
  { step: "구매확정", count: "988", note: "정산 대상" },
];

export const RETURN_REASONS = [
  { name: "사이즈 교환", width: 41, share: "41.6%" },
  { name: "단순 변심", width: 28, share: "27.7%" },
  { name: "색상 차이", width: 14, share: "13.9%" },
  { name: "불량", width: 9, share: "8.8%" },
  { name: "기타", width: 8, share: "8.0%" },
];

export const ASSIGNEES: {
  name: string;
  meta: string;
  badge: string;
  badgeTone?: "risk" | "warn" | "accent" | "outline";
  image?: string;
}[] = [
  {
    name: "한지우",
    meta: "CS팀 · CS 담당 · 계정 잠김 · 배정된 문의 8건",
    badge: "재배정 필요",
    badgeTone: "risk",
  },
  {
    name: "이도윤",
    meta: "CS팀 · CS 담당 · 미답변 6건 · 평균 응답 2시간 10분",
    badge: "처리 중",
    badgeTone: "warn",
    image: "/user-3.webp",
  },
  {
    name: "박준혁",
    meta: "이커머스팀 · 운영 관리자 · 반품 승인 6건 · 출고 27건",
    badge: "처리 중",
    badgeTone: "warn",
    image: "/user-2.webp",
  },
  {
    name: "최민지",
    meta: "재무팀 · 정산 담당 · 8월 정산 확정 · 09-20까지",
    badge: "예정",
    image: "/user-4.webp",
  },
  {
    name: "정하람",
    meta: "MD팀 · MD · 신규 상품 승인 요청 2건 · 발주 제안 9건",
    badge: "승인 대기",
    badgeTone: "accent",
  },
  { name: "오세진", meta: "마케팅팀 · 초대 대기 · 09-11 초대 발송", badge: "미가입", badgeTone: "outline" },
];
