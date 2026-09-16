import Image from "next/image";

import { Icon } from "@/components/Icon";
import { SalesChart } from "@/components/SalesChart";
import { Shell } from "@/components/Shell";
import { requireMe } from "@/lib/me";

import {
  ASSIGNEES,
  CATEGORY_SHARE,
  FIGURES,
  ORDER_FLOW,
  QUEUE,
  RETURN_REASONS,
  SALES_CHART,
  SIZES,
  STOCK,
  TOP_PRODUCTS,
} from "./mock";

// 시안 ref/design/dashboard.html을 옮긴 화면이다. 숫자는 전부 합성 데이터이고,
// 집계 API가 생기면 mock.ts를 걷어내고 그 자리에 실제 값을 넣는다.
export default async function DashboardPage() {
  const me = await requireMe();

  return (
    <Shell me={me} activeMenuCode="OPS_DASHBOARD" title="대시보드">
      <div className="scopebar">
        <span className="scopebar__lead">
          <Icon name="eye" size={14} />
          조회 범위
        </span>
        <button className="scope is-set" type="button">
          <Icon name="store" size={14} />
          <b>호카코리아</b> 브랜드스토어
        </button>
        <button className="scope is-set" type="button">
          <Icon name="calendar" size={14} />
          2026-09-01 ~ 09-15
        </button>
        <button className="scope" type="button">
          <Icon name="layers" size={14} />
          카테고리 전체
        </button>
        <button className="scope scope--ghost" type="button">
          <Icon name="plus" size={14} />
          조건 추가
        </button>
        <span className="scopebar__spacer" />
        <div className="seg" role="group" aria-label="상품군">
          <button type="button" aria-pressed="true">
            전체
          </button>
          <button type="button" aria-pressed="false">
            로드
          </button>
          <button type="button" aria-pressed="false">
            트레일
          </button>
          <button type="button" aria-pressed="false">
            라이프스타일
          </button>
        </div>
        <span className="t-xs dim num">10:42 갱신</span>
        <button className="btn btn--ghost btn--icon btn--sm" type="button" aria-label="다시 조회">
          <Icon name="refresh" size={15} />
        </button>
      </div>

      <main className="page">
        {/* 1행 : 매출 추이 + 처리 대기 큐 */}
        <div className="split split--wide">
          <section className="panel">
            <div className="panel__head">
              <h3>매출 추이</h3>
              <span className="badge badge--outline">네이버페이 결제 기준</span>
              <div className="right-slot">
                <div className="legend">
                  <span>
                    <i />
                    9월
                  </span>
                  <span>
                    <i className="compare" />8월 같은 날
                  </span>
                </div>
                <button className="btn btn--secondary btn--sm" type="button">
                  매출 상세
                  <Icon name="right" size={14} />
                </button>
              </div>
            </div>

            <dl className="figures">
              {FIGURES.map((figure) => (
                <div key={figure.label}>
                  <dt>{figure.label}</dt>
                  <dd>
                    <span className="figure">{figure.value}</span>
                    <span className="unit">{figure.unit}</span>
                    <span className={figure.up ? "delta delta--up" : "delta delta--down"}>
                      <Icon name={figure.up ? "upright" : "downright"} size={12} />
                      {figure.delta}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="panel__body">
              <div className="chartbox">
                <SalesChart
                  values={SALES_CHART.values}
                  compare={SALES_CHART.compare}
                  labels={SALES_CHART.labels}
                  height={176}
                  suffix={SALES_CHART.suffix}
                  todayIndex={SALES_CHART.todayIndex}
                  labelEvery={SALES_CHART.labelEvery}
                />
              </div>
            </div>

            <div className="panel__body" style={{ borderTop: "1px solid var(--hairline)" }}>
              <div className="grid grid--2" style={{ gap: "var(--s-5)" }}>
                <div>
                  <div className="sechead">
                    <h2>카테고리별 판매</h2>
                    <span className="t-xs dim">9월 누계 · 매출액 기준</span>
                  </div>
                  {CATEGORY_SHARE.map((row) => (
                    <div className="hbar" key={row.name}>
                      <span>{row.name}</span>
                      <span className="hbar__track">
                        <i className="hbar__fill" style={{ width: `${row.width}%` }} />
                      </span>
                      <span className="num right">{row.share}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="sechead">
                    <h2>많이 팔린 상품</h2>
                    <span className="t-xs muted">상품 관리</span>
                  </div>
                  <ul className="stack">
                    {TOP_PRODUCTS.map((product) => (
                      <li
                        key={product.name}
                        style={{ gridTemplateColumns: "30px minmax(0, 1fr) auto", padding: "7px 0" }}
                      >
                        <Image className="thumb" src={product.image} alt="" width={30} height={30} />
                        <span className="cellstack">
                          <span className="primary">{product.name}</span>
                          <small>{product.meta}</small>
                        </span>
                        <span className="num">{product.sold}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h3>처리 대기</h3>
              <span className="badge badge--risk">{QUEUE.length}</span>
              <div className="right-slot">
                <button className="btn btn--ghost btn--sm" type="button">
                  기한순
                </button>
              </div>
            </div>
            <ul className="stack queue">
              {QUEUE.map((item) => (
                <li key={item.title}>
                  <span className={`queue__icon is-${item.tone}`}>
                    <Icon name={item.icon} size={13} />
                  </span>
                  <span className="grow">
                    <span className="queue__title">{item.title}</span>
                    <span className="queue__meta">{item.meta}</span>
                  </span>
                  <span className={item.badgeTone ? `badge badge--${item.badgeTone}` : "badge"}>{item.badge}</span>
                  <span className="queue__go">
                    <Icon name="right" size={14} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="panel__foot">
              <span className="t-xs muted">항목을 열면 기간·카테고리 조건이 그대로 넘어갑니다.</span>
              <span className="grow" />
              <button className="btn btn--ghost btn--sm" type="button">
                전체 보기
              </button>
            </div>
          </section>
        </div>

        {/* 2행 : 사이즈별 재고 */}
        <section className="panel">
          <div className="panel__head">
            <h3>사이즈별 재고</h3>
            <span className="t-xs dim">판매 상위 5개 · 9월 15일 10:42 기준</span>
            <div className="right-slot">
              <div className="seg" role="group" aria-label="성별">
                <button type="button" aria-pressed="true">
                  남성
                </button>
                <button type="button" aria-pressed="false">
                  여성
                </button>
                <button type="button" aria-pressed="false">
                  공용
                </button>
              </div>
              <button className="btn btn--secondary btn--sm" type="button">
                재고 관리
              </button>
            </div>
          </div>
          <div className="tablewrap">
            <table className="sizegrid">
              <thead>
                <tr>
                  <th style={{ textAlign: "left", paddingLeft: "var(--s-3)", fontSize: "11.5px" }}>상품</th>
                  {SIZES.map((size) => (
                    <th key={size}>{size}</th>
                  ))}
                  <th style={{ textAlign: "right", paddingRight: "var(--s-3)" }}>합계</th>
                </tr>
              </thead>
              <tbody>
                {STOCK.map((row) => (
                  <tr key={row.name}>
                    <th>
                      <Image
                        className="thumb"
                        src={row.image}
                        alt=""
                        width={24}
                        height={24}
                        style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }}
                      />
                      {row.name}
                      <small style={{ paddingLeft: 32 }}>{row.meta}</small>
                    </th>
                    {row.cells.map((cell, index) => (
                      <td key={SIZES[index]}>
                        <span className={cellClass(cell)}>{cell === null ? "-" : cell}</span>
                      </td>
                    ))}
                    <td className="right" style={{ paddingRight: "var(--s-3)" }}>
                      <span>{row.total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel__foot">
            <span className="t-xs muted">
              사이즈당 10족 미만이면 노란색, 0족이면 빨간색입니다. 발주 제안은 재고·사이즈 메뉴에서 만듭니다.
            </span>
            <span className="grow" />
            <button className="btn btn--ghost btn--sm" type="button">
              전체 312개 상품 보기
            </button>
          </div>
        </section>

        {/* 3행 : 주문 처리 흐름 + 담당자별 대기 */}
        <div className="grid grid--2">
          <section className="panel">
            <div className="panel__head">
              <h3>주문 처리 흐름</h3>
              <span className="t-xs dim">오늘 10:42 기준 · 건</span>
              <div className="right-slot">
                <button className="btn btn--ghost btn--sm" type="button">
                  주문·배송
                </button>
              </div>
            </div>
            <div className="panel__body">
              <dl className="flow">
                {ORDER_FLOW.map((step) => (
                  <div className={step.risk ? "is-risk" : undefined} key={step.step}>
                    <dt>{step.step}</dt>
                    <dd>
                      <span className="figure">{step.count}</span>
                    </dd>
                    <small style={step.risk ? { color: "var(--risk)" } : undefined}>{step.note}</small>
                  </div>
                ))}
              </dl>

              <div className="sechead mt-5">
                <h2>반품·교환 사유</h2>
                <span className="t-xs dim">9월 누계 · 137건</span>
              </div>
              {RETURN_REASONS.map((reason) => (
                <div className="hbar" key={reason.name}>
                  <span>{reason.name}</span>
                  <span className="hbar__track">
                    <i className="hbar__fill" style={{ width: `${reason.width}%` }} />
                  </span>
                  <span className="num right">{reason.share}</span>
                </div>
              ))}
              <div className="note note--warn mt-4" style={{ border: 0, background: "none", padding: "0 0 0 2px" }}>
                <Icon name="info" size={16} />
                <div>
                  사이즈 교환이 계속 4할을 넘습니다. 상품 페이지의 사이즈 가이드를 기획전·콘텐츠에서 손볼 수 있습니다.
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <h3>담당자별 대기</h3>
              <span className="t-xs dim">2026-09-15</span>
              <div className="right-slot">
                <button className="btn btn--ghost btn--sm" type="button">
                  사용자 관리
                </button>
              </div>
            </div>
            <ul className="stack">
              {ASSIGNEES.map((person) => (
                <li key={person.name} style={{ gridTemplateColumns: "26px minmax(0, 1fr) auto" }}>
                  {person.image ? (
                    <Image className="avatar" src={person.image} alt="" width={26} height={26} />
                  ) : (
                    <span className="avatar initial">{person.name.slice(0, 1)}</span>
                  )}
                  <span className="cellstack">
                    <span className="primary">{person.name}</span>
                    <small>{person.meta}</small>
                  </span>
                  <span className={person.badgeTone ? `badge badge--${person.badgeTone}` : "badge"}>
                    {person.badge}
                  </span>
                </li>
              ))}
            </ul>
            <div className="panel__foot">
              <span className="t-xs muted">
                잠긴 계정의 배정 건은 자동으로 넘어가지 않습니다. 사용자 관리에서 풀거나 재배정하세요.
              </span>
            </div>
          </section>
        </div>
      </main>
    </Shell>
  );
}

function cellClass(cell: number | "품절" | null) {
  if (cell === null) return "is-na";
  if (cell === "품절") return "is-out";
  return cell < 10 ? "is-low" : undefined;
}
