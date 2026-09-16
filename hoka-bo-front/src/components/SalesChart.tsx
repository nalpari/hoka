// 시안 app.js의 draw()를 서버 렌더 SVG로 옮겼다. 좌표·클래스는 그대로라 hoka.css가 그대로 붙는다.
const W = 720;
const PAD_L = 48;
const PAD_R = 6;
const PAD_T = 8;
const PAD_B = 20;

type Props = {
  values: number[];
  compare?: number[];
  labels?: string[];
  height?: number;
  suffix?: string;
  todayIndex?: number;
  labelEvery?: number;
};

export function SalesChart({
  values,
  compare,
  labels,
  height = 168,
  suffix = "",
  todayIndex = -1,
  labelEvery,
}: Props) {
  const innerWidth = W - PAD_L - PAD_R;
  const innerHeight = height - PAD_T - PAD_B;
  const max = niceMax(Math.max(...values, ...(compare ?? [])) * 1.06);
  const slot = innerWidth / values.length;
  const y = (value: number) => PAD_T + innerHeight - (value / max) * innerHeight;
  const cx = (index: number) => PAD_L + (index + 0.5) * slot;
  const barWidth = Math.max(3, slot * 0.58);
  const every = labelEvery ?? Math.ceil(values.length / 7);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} role="img" className="chart" aria-label="일별 매출 막대 차트">
      {[0, 0.5, 1].map((t) => {
        const lineY = y(max * t);
        return (
          <g key={t}>
            <line className={t === 0 ? "axis" : "gridline"} x1={PAD_L} x2={W - PAD_R} y1={lineY} y2={lineY} />
            <text className="axistext" x={PAD_L - 8} y={lineY + 3.5} textAnchor="end">
              {format(max * t)}
              {t === 1 ? suffix : ""}
            </text>
          </g>
        );
      })}

      {values.map((value, index) => (
        <rect
          className={index === todayIndex ? "bar bar--today" : "bar"}
          key={index}
          x={cx(index) - barWidth / 2}
          y={y(value)}
          width={barWidth}
          height={Math.max(1, (value / max) * innerHeight)}
          rx={1.5}
        >
          {/* React는 <title>을 메타데이터로 다뤄 자식이 여러 개면 SSR에서 내용을 버린다.
              나눠 쓰면 서버는 빈 <title>, 브라우저는 채워진 값이 돼 하이드레이션이 어긋난다. */}
          <title>{`${labels?.[index] ? `${labels[index]}일 ` : ""}${format(value)}${suffix}`}</title>
        </rect>
      ))}

      {compare ? (
        <path
          className="line--compare"
          d={compare
            .map((value, index) => `${index ? "L" : "M"}${cx(index).toFixed(1)} ${y(value).toFixed(1)}`)
            .join(" ")}
        />
      ) : null}

      {labels?.map((label, index) =>
        index % every === 0 || index === values.length - 1 ? (
          <text className="axistext" key={label} x={cx(index)} y={height - 4} textAnchor="middle">
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

// toLocaleString은 서버와 브라우저의 ICU 차이로 결과가 갈릴 수 있어 직접 찍는다.
function format(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
