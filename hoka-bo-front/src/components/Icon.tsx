import { ICON_PATHS, type IconName } from "./icons";

export type { IconName };

// path 데이터는 우리가 옮겨 둔 정적 상수다(icons.ts). 외부 입력이 들어올 자리가 없다.
export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );
}

// HOKA H 마크: 두 기둥 + 오른쪽으로 솟는 가로획.
export function Brandmark({ size = 26 }: { size?: number }) {
  return (
    <span className="brandmark" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="1" width="22" height="22" rx="6.5" fill="currentColor" />
        <path
          d="M8 6.5v11M16 6.5v11M8 13.4l8-2.8"
          fill="none"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
