import Image from "next/image";

// 사진이 있으면 사진, 없으면 이름 첫 글자. 목록·상세·역할 구성원·레일이 모두 이것을 쓴다.
// 사진은 서버가 128x128 PNG로 정규화해 두므로 어느 크기로 그려도 한 장이면 된다.
const PIXELS = { sm: 20, md: 26, lg: 44 } as const;

export function Avatar({
  id,
  name,
  updatedAt,
  size = "md",
}: {
  id: number;
  name: string;
  updatedAt: string | null;
  size?: keyof typeof PIXELS;
}) {
  const className = size === "md" ? "avatar" : `avatar avatar--${size}`;

  if (!updatedAt) {
    // sm은 20px라 기본 11px 글자가 넘친다.
    return (
      <span className={`${className} initial`} style={size === "sm" ? { fontSize: 9 } : undefined}>
        {name.slice(0, 1)}
      </span>
    );
  }

  const pixels = PIXELS[size];
  return (
    <Image
      className={className}
      src={`/avatar/${id}?v=${Date.parse(updatedAt)}`}
      alt={`${name} 프로필 사진`}
      width={pixels}
      height={pixels}
      // 이미 128px로 줄여 둔 작은 PNG다. 다시 최적화할 게 없고 요청만 한 번 더 늘어난다.
      unoptimized
    />
  );
}
