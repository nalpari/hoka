// 시안(ref/design/assets/app.js)의 아이콘 세트에서 지금 쓰는 것만 옮겼다.
// 새 화면에서 필요한 아이콘이 생기면 그때 같은 규격(24×24, stroke 1.5)으로 추가한다.
export type IconName = "eye" | "eyeoff" | "alert" | "mail" | "shield" | "unlock";

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
    >
      {PATHS[name]}
    </svg>
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

const PATHS: Record<IconName, React.ReactNode> = {
  eye: (
    <>
      <path d="M2.6 12S6.2 5.6 12 5.6 21.4 12 21.4 12 17.8 18.4 12 18.4 2.6 12 2.6 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeoff: (
    <>
      <path d="M3.4 3.4 20.6 20.6" />
      <path d="M10 6c.6-.2 1.3-.4 2-.4 5.8 0 9.4 6.4 9.4 6.4a17 17 0 0 1-3.1 3.8" />
      <path d="M6.4 7.6A16 16 0 0 0 2.6 12S6.2 18.4 12 18.4c1.6 0 3-.4 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 7.4v5.1" />
      <path d="M12 16.2h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.4" width="18" height="13.2" rx="1.8" />
      <path d="m3.6 6.6 8.4 6.6 8.4-6.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.1 20 6v6.1c0 4.5-3.4 7.9-8 8.9-4.6-1-8-4.4-8-8.9V6z" />
      <path d="m8.9 12.1 2.1 2.1 4.1-4.2" />
    </>
  ),
  unlock: (
    <>
      <rect x="4.4" y="10" width="15.2" height="10.6" rx="1.8" />
      <path d="M7.9 10V7.6a4.1 4.1 0 0 1 8-1" />
    </>
  ),
};
