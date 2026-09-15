/* HOKA 백오피스 디자인 시안 — 공용 셸(아이콘 스프라이트 · 좌측 레일 · 테마 · 차트) */
(function () {
  "use strict";

  /* ---------- 아이콘 : 24×24 그리드, stroke 1.5, round cap/join ---------- */
  var ICONS = {
    home: '<path d="M3.2 10.4 12 3.2l8.8 7.2"/><path d="M5.5 9.4V20.3h13V9.4"/><path d="M9.6 20.3v-5.6h4.8v5.6"/>',
    cart: '<path d="M3 4.2h2.4l2.2 11.2h10.6l2-7.6H6.4"/><circle cx="9.4" cy="19.6" r="1.4"/><circle cx="16.8" cy="19.6" r="1.4"/>',
    truck:
      '<path d="M3.2 6.4h11.2v9.6H3.2z"/><path d="M14.4 9.6h3.6l2.8 3.2v3.2h-6.4"/><circle cx="7" cy="17.6" r="1.8"/><circle cx="17" cy="17.6" r="1.8"/>',
    undo: '<path d="M9.2 7.4 5.4 11.2l3.8 3.8"/><path d="M5.4 11.2h9.2a4.2 4.2 0 0 1 0 8.4H11"/>',
    message:
      '<path d="M4.2 5.4h15.6a1.6 1.6 0 0 1 1.6 1.6v8.8a1.6 1.6 0 0 1-1.6 1.6H9.6l-4.4 3.6v-3.6H4.2a1.6 1.6 0 0 1-1.6-1.6V7a1.6 1.6 0 0 1 1.6-1.6z"/>',
    box: '<path d="M12 3.1 20.6 7.7v8.6L12 20.9l-8.6-4.6V7.7z"/><path d="M3.4 7.7 12 12.3l8.6-4.6"/><path d="M12 12.3v8.6"/>',
    ruler:
      '<path d="m3.4 15.8 12.4-12.4 4.8 4.8L8.2 20.6z"/><path d="m8.6 10.6 2 2"/><path d="m11.4 7.8 2 2"/><path d="m5.8 13.4 2 2"/>',
    layers:
      '<path d="M12 3.4 2.9 7.9 12 12.4l9.1-4.5z"/><path d="M2.9 12.4 12 16.9l9.1-4.5"/><path d="M2.9 16.6 12 21.1l9.1-4.5"/>',
    tag: '<path d="M11.2 3.2H4.6a1.4 1.4 0 0 0-1.4 1.4v6.6l9.6 9.6a1.4 1.4 0 0 0 2 0l6.6-6.6a1.4 1.4 0 0 0 0-2z"/><circle cx="7.6" cy="7.6" r="1.3"/>',
    image:
      '<rect x="3.4" y="4.4" width="17.2" height="15.2" rx="1.8"/><circle cx="8.6" cy="9.4" r="1.7"/><path d="m20.6 15.4-4.6-4.6-8.4 8.4"/>',
    users:
      '<circle cx="9.2" cy="8.2" r="3.6"/><path d="M2.6 20.3a6.6 6.6 0 0 1 13.2 0"/><path d="M16.2 5.3a3.6 3.6 0 0 1 0 5.8"/><path d="M17.8 14.4a6.6 6.6 0 0 1 3.6 5.9"/>',
    user: '<circle cx="12" cy="8.4" r="3.8"/><path d="M4.6 20.6a7.4 7.4 0 0 1 14.8 0"/>',
    star: '<path d="m12 3.6 2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.9l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z"/>',
    wallet:
      '<path d="M3.4 8.4A2.4 2.4 0 0 1 5.8 6h11.4"/><rect x="3.4" y="8.4" width="17.2" height="11.9" rx="1.6"/><circle cx="16.6" cy="14.3" r="1.2" fill="currentColor" stroke="none"/>',
    receipt:
      '<path d="M6 3.2h12v17.6l-2.4-1.5-2.4 1.5-2.4-1.5-2.4 1.5L6 20.8z"/><path d="M9.4 8.4h5.2"/><path d="M9.4 12.2h5.2"/>',
    sitemap:
      '<rect x="9" y="3.2" width="6" height="4.6" rx="1"/><rect x="3.2" y="16.2" width="6" height="4.6" rx="1"/><rect x="14.8" y="16.2" width="6" height="4.6" rx="1"/><path d="M12 7.8v4.2"/><path d="M6.2 16.2V12h11.6v4.2"/>',
    shield:
      '<path d="M12 3.1 20 6v6.1c0 4.5-3.4 7.9-8 8.9-4.6-1-8-4.4-8-8.9V6z"/><path d="m8.9 12.1 2.1 2.1 4.1-4.2"/>',
    file: '<path d="M14 3.4H7.2a1.6 1.6 0 0 0-1.6 1.6v14a1.6 1.6 0 0 0 1.6 1.6h9.6a1.6 1.6 0 0 0 1.6-1.6V7.8z"/><path d="M14 3.4v4.4h4.4"/><path d="M8.6 12.6h6.8"/><path d="M8.6 16.1h4.8"/>',
    help: '<circle cx="12" cy="12" r="8.8"/><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.3-2.6 4"/><path d="M12 17.3h.01"/>',
    search: '<circle cx="11" cy="11" r="6.6"/><path d="m15.9 15.9 5.1 5.1"/>',
    filter: '<path d="M3.4 5.4h17.2l-6.7 7.7v5.9l-3.8 1.9v-7.8z"/>',
    plus: '<path d="M12 5.2v13.6"/><path d="M5.2 12h13.6"/>',
    minus: '<path d="M5.2 12h13.6"/>',
    down: '<path d="m6.2 9.2 5.8 5.8 5.8-5.8"/>',
    right: '<path d="m9.2 5.8 6.1 6.2-6.1 6.2"/>',
    left: '<path d="m14.8 5.8-6.1 6.2 6.1 6.2"/>',
    up: '<path d="m6.2 14.8 5.8-5.8 5.8 5.8"/>',
    selector: '<path d="m8.2 9.6 3.8-3.8 3.8 3.8"/><path d="m8.2 14.4 3.8 3.8 3.8-3.8"/>',
    dots: '<circle cx="5.2" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    grip: '<circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
    check: '<path d="m5.2 12.8 4.6 4.6L18.8 6.6"/>',
    x: '<path d="m6.2 6.2 11.6 11.6"/><path d="m17.8 6.2-11.6 11.6"/>',
    warn: '<path d="M12 4.2 21 19.8H3z"/><path d="M12 10.2v3.9"/><path d="M12 17h.01"/>',
    alert: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.4v5.1"/><path d="M12 16.2h.01"/>',
    info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.6"/><path d="M12 7.8h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 6.9v5.4l3.3 2"/>',
    calendar:
      '<rect x="3.4" y="5" width="17.2" height="15.6" rx="1.8"/><path d="M3.4 10.1h17.2"/><path d="M8.2 3v4"/><path d="M15.8 3v4"/>',
    download: '<path d="M12 4v11.2"/><path d="m7.4 10.9 4.6 4.6 4.6-4.6"/><path d="M4.4 19.7h15.2"/>',
    upload: '<path d="M12 19.4V8.2"/><path d="m7.4 12.5 4.6-4.6 4.6 4.6"/><path d="M4.4 4.3h15.2"/>',
    external:
      '<path d="M14.2 4.4h5.4v5.4"/><path d="M19.6 4.4 11 13"/><path d="M18 14.3v5.3H4.4V6h5.4"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 4.9-2 6.5-2 6.5h16S18 13.9 18 9z"/><path d="M13.8 19a2.1 2.1 0 0 1-3.6 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2.5"/><path d="M12 18.9v2.5"/><path d="m4.9 4.9 1.8 1.8"/><path d="m17.3 17.3 1.8 1.8"/><path d="M2.6 12h2.5"/><path d="M18.9 12h2.5"/><path d="m4.9 19.1 1.8-1.8"/><path d="m17.3 6.7 1.8-1.8"/>',
    moon: '<path d="M20.1 14.6A8.6 8.6 0 0 1 9.4 3.9a8.6 8.6 0 1 0 10.7 10.7z"/>',
    upright: '<path d="M7.2 16.8 16.8 7.2"/><path d="M8.9 7.2h7.9v7.9"/>',
    downright: '<path d="M7.2 7.2 16.8 16.8"/><path d="M16.8 8.9v7.9H8.9"/>',
    lock: '<rect x="4.4" y="10" width="15.2" height="10.6" rx="1.8"/><path d="M7.9 10V7.6a4.1 4.1 0 0 1 8.2 0V10"/>',
    unlock: '<rect x="4.4" y="10" width="15.2" height="10.6" rx="1.8"/><path d="M7.9 10V7.6a4.1 4.1 0 0 1 8-1"/>',
    key: '<circle cx="8" cy="14" r="4.2"/><path d="m11 11 8.6-8.6"/><path d="m16.4 5.6 2.8 2.8"/><path d="m13.8 8.2 2.8 2.8"/>',
    mail: '<rect x="3" y="5.4" width="18" height="13.2" rx="1.8"/><path d="m3.6 6.6 8.4 6.6 8.4-6.6"/>',
    edit: '<path d="M4.2 20.2h4L18.6 9.8a2.1 2.1 0 0 0-3-3L5.2 17.2z"/><path d="m14.6 6.4 3 3"/>',
    trash:
      '<path d="M4.4 6.4h15.2"/><path d="M9.6 6.4V4.3h4.8v2.1"/><path d="m6.6 6.4 1 13.6h8.8l1-13.6"/><path d="M10.2 10v6.4"/><path d="M13.8 10v6.4"/>',
    copy: '<rect x="8.6" y="8.6" width="12" height="12" rx="1.8"/><path d="M5.6 15.4H4.4a1 1 0 0 1-1-1V4.4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1.2"/>',
    branch:
      '<circle cx="7" cy="5.6" r="2.3"/><circle cx="7" cy="18.4" r="2.3"/><circle cx="17" cy="8.6" r="2.3"/><path d="M7 7.9v8.2"/><path d="M17 10.9c0 3.2-2.7 4.6-6.2 5.3"/>',
    store:
      '<path d="M4.6 9.6v10.7h14.8V9.6"/><path d="M3 9.6 4.7 3.9h14.6L21 9.6"/><path d="M3 9.6a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9.6 20.3v-6.1h4.8v6.1"/>',
    logout:
      '<path d="M9.2 20.6H5.6A1.6 1.6 0 0 1 4 19V5a1.6 1.6 0 0 1 1.6-1.6h3.6"/><path d="m15.4 16.4 4.4-4.4-4.4-4.4"/><path d="M19.8 12H9.6"/>',
    refresh: '<path d="M20.3 12a8.3 8.3 0 1 1-2.5-5.9"/><path d="M20.3 3.4V9h-5.6"/>',
    eye: '<path d="M2.6 12S6.2 5.6 12 5.6 21.4 12 21.4 12 17.8 18.4 12 18.4 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff:
      '<path d="M3.4 3.4 20.6 20.6"/><path d="M10 6c.6-.2 1.3-.4 2-.4 5.8 0 9.4 6.4 9.4 6.4a17 17 0 0 1-3.1 3.8"/><path d="M6.4 7.6A16 16 0 0 0 2.6 12S6.2 18.4 12 18.4c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    menu: '<path d="M3.6 6.6h16.8"/><path d="M3.6 12h16.8"/><path d="M3.6 17.4h16.8"/>',
    sliders:
      '<path d="M3.6 6.5h9.2"/><path d="M17.4 6.5h3"/><path d="M3.6 12h2.2"/><path d="M10.4 12h10"/><path d="M3.6 17.5h8.2"/><path d="M16.4 17.5h4"/><circle cx="15.1" cy="6.5" r="2.3"/><circle cx="8.1" cy="12" r="2.3"/><circle cx="14.1" cy="17.5" r="2.3"/>',
    history: '<path d="M3.7 12a8.3 8.3 0 1 0 2.4-5.9"/><path d="M3.7 3.4V9h5.6"/><path d="M12 7.6v4.8l3 1.8"/>',
    smartphone: '<rect x="6.4" y="2.6" width="11.2" height="18.8" rx="2.4"/><path d="M10.4 18.4h3.2"/>',
    chart: '<path d="M4 3.6v16.8h16.4"/><path d="M7.4 15.3 11 10.6l3.1 2.6 4.8-6"/>',
  };

  function iconSprite() {
    var out = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">';
    for (var k in ICONS) {
      out +=
        '<symbol id="i-' +
        k +
        '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        ICONS[k] +
        "</symbol>";
    }
    return out + "</svg>";
  }

  function ic(name, size) {
    return (
      '<svg width="' +
      (size || 16) +
      '" height="' +
      (size || 16) +
      '" aria-hidden="true"><use href="#i-' +
      name +
      '"/></svg>'
    );
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      if (el.dataset.iconDone) return;
      el.insertAdjacentHTML("afterbegin", ic(el.dataset.icon, el.dataset.iconSize || 16));
      el.dataset.iconDone = "1";
    });
  }

  /* ---------- 좌측 레일 : 전 페이지 공통, data-page 로 활성 표시 ----------
     메뉴 트리는 menus.html 에서 관리하는 것과 같은 구조다. */
  var NAV = [
    {
      label: "운영",
      items: [
        { id: "dashboard", href: "dashboard.html", icon: "home", text: "대시보드" },
        { id: "orders", href: "#", icon: "truck", text: "주문·배송", count: "27", risk: true },
        { id: "claims", href: "#", icon: "undo", text: "클레임·반품", count: "6" },
        { id: "inquiries", href: "#", icon: "message", text: "문의·리뷰", count: "14" },
      ],
    },
    {
      label: "상품",
      items: [
        { id: "products", href: "#", icon: "box", text: "상품 관리" },
        { id: "stock", href: "#", icon: "ruler", text: "재고·사이즈", count: "9", risk: true },
        { id: "display", href: "#", icon: "layers", text: "카테고리·전시" },
      ],
    },
    {
      label: "마케팅",
      items: [
        { id: "promotions", href: "#", icon: "tag", text: "프로모션·쿠폰" },
        { id: "contents", href: "#", icon: "image", text: "기획전·콘텐츠" },
      ],
    },
    {
      label: "회원",
      items: [
        { id: "members", href: "#", icon: "users", text: "회원 관리" },
        { id: "grades", href: "#", icon: "star", text: "등급·혜택" },
      ],
    },
    {
      label: "정산",
      items: [
        { id: "settlement", href: "#", icon: "wallet", text: "정산·매출" },
        { id: "tax", href: "#", icon: "receipt", text: "세금계산서" },
      ],
    },
    {
      label: "시스템",
      items: [
        { id: "menus", href: "menus.html", icon: "sitemap", text: "메뉴 관리" },
        { id: "users", href: "users.html", icon: "user", text: "사용자 관리" },
        { id: "roles", href: "roles.html", icon: "shield", text: "권한 관리" },
        { id: "audit", href: "#", icon: "file", text: "감사 로그" },
      ],
    },
  ];

  function brandMark() {
    /* 단순 기하 마크 : 접힌 두 날개 — "FLY HUMAN FLY" */
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<rect x="1" y="1" width="22" height="22" rx="6.5" fill="currentColor"/>' +
      '<path d="M5.5 10.2 12 6.4l6.5 3.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M5.5 15.6 12 11.8l6.5 3.8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".62"/>' +
      "</svg>"
    );
  }

  function railMarkup(active) {
    var nav = "";
    NAV.forEach(function (g) {
      nav += '<div class="navgroup"><span class="navgroup__label">' + g.label + "</span>";
      g.items.forEach(function (it) {
        var on = it.id === active;
        nav +=
          '<a class="navitem' +
          (on ? " is-active" : "") +
          '" href="' +
          it.href +
          '"' +
          (on ? ' aria-current="page"' : "") +
          ">" +
          ic(it.icon, 17) +
          "<span>" +
          it.text +
          "</span>" +
          (it.count
            ? '<span class="navitem__count' + (it.risk ? " is-risk" : "") + '">' + it.count + "</span>"
            : "<span></span>") +
          "</a>";
      });
      nav += "</div>";
    });

    return (
      '<a class="rail__brand" href="index.html">' +
      '<span class="brandmark">' +
      brandMark() +
      "</span>" +
      '<b class="wordmark">HOKA</b><span class="rail__tag">백오피스</span>' +
      "</a>" +
      '<div class="switcher"><button class="switcher__btn" type="button">' +
      '<span class="switcher__logo">N</span>' +
      '<span><span class="switcher__name">호카코리아 브랜드스토어</span>' +
      '<span class="switcher__meta">네이버 · 운영 중 · 상품 312</span></span>' +
      ic("selector", 15) +
      "</button></div>" +
      '<div class="rail__search">' +
      ic("search", 14) +
      '<input type="search" placeholder="주문번호·상품·회원 검색" aria-label="검색"><kbd>⌘K</kbd></div>' +
      '<nav class="rail__nav" aria-label="주요 메뉴">' +
      nav +
      "</nav>" +
      '<div class="rail__foot">' +
      '<a class="deploycard" href="menus.html">' +
      '<span class="deploycard__top"><span class="deploycard__name">메뉴 트리 v12</span>' +
      '<span class="badge badge--ok">배포됨</span></span>' +
      '<span class="t-xs muted">09-12 18:40 · 김서연</span></a>' +
      '<button class="userchip" type="button">' +
      '<img class="avatar" src="assets/img/user-1.webp" alt="">' +
      '<span><span class="switcher__name">김서연</span>' +
      '<span class="switcher__meta">슈퍼관리자 · 이커머스팀</span></span>' +
      ic("dots", 15) +
      "</button></div>"
    );
  }

  function topActions() {
    return (
      '<button class="btn btn--ghost btn--icon btn--sm" type="button" aria-label="알림" title="알림">' +
      ic("bell", 16) +
      "</button>" +
      '<button class="btn btn--ghost btn--icon btn--sm" type="button" aria-label="도움말" title="도움말">' +
      ic("help", 16) +
      "</button>" +
      '<button class="btn btn--secondary btn--sm" type="button" id="themeToggle" aria-label="테마 전환">' +
      '<span class="theme-dark">' +
      ic("sun", 15) +
      "밝게</span>" +
      '<span class="theme-light">' +
      ic("moon", 15) +
      "어둡게</span>" +
      "</button>"
    );
  }

  /* ---------- 부팅 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML("afterbegin", iconSprite());

    var rail = document.getElementById("rail");
    if (rail) rail.innerHTML = railMarkup(document.body.dataset.page || "");

    document.querySelectorAll("[data-topact]").forEach(function (el) {
      el.insertAdjacentHTML("afterbegin", topActions());
    });

    document.querySelectorAll("[data-railtoggle]").forEach(function (el) {
      el.insertAdjacentHTML("afterbegin", ic("menu", 17));
      el.addEventListener("click", function () {
        document.body.classList.toggle("rail-open");
      });
    });

    document.querySelectorAll("[data-brandmark]").forEach(function (el) {
      el.innerHTML = brandMark();
    });

    hydrateIcons(document);

    var t = document.getElementById("themeToggle");
    if (t) {
      t.addEventListener("click", function () {
        var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("hoka-theme", next);
        } catch (e) {}
      });
    }

    /* 세그먼티드 컨트롤 · 탭 : 시안용 상태 전환 */
    document.querySelectorAll(".seg").forEach(function (seg) {
      seg.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        seg.querySelectorAll("button").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
      });
    });

    document.querySelectorAll(".tabs").forEach(function (tabs) {
      tabs.addEventListener("click", function (e) {
        var b = e.target.closest("[role=tab]");
        if (!b) return;
        e.preventDefault();
        tabs.querySelectorAll("[role=tab]").forEach(function (x) {
          x.setAttribute("aria-selected", x === b ? "true" : "false");
        });
      });
    });

    /* 전체 선택 체크박스 */
    document.querySelectorAll("[data-checkall]").forEach(function (master) {
      var scope = master.closest("table");
      if (!scope) return;
      master.addEventListener("change", function () {
        scope.querySelectorAll("tbody .rowcheck input").forEach(function (c) {
          c.checked = master.checked;
          c.closest("tr").classList.toggle("is-selected", master.checked);
        });
      });
      scope.querySelectorAll("tbody .rowcheck input").forEach(function (c) {
        c.addEventListener("change", function () {
          c.closest("tr").classList.toggle("is-selected", c.checked);
        });
      });
    });

    /* 목록 · 트리 선택 (시안용) */
    document.querySelectorAll("[data-selectable]").forEach(function (list) {
      list.addEventListener("click", function (e) {
        var row = e.target.closest("[data-row]");
        if (!row || e.target.closest("input, button, a")) return;
        list.querySelectorAll("[data-row]").forEach(function (r) {
          r.classList.toggle("is-selected", r === row);
        });
      });
    });

    /* 비밀번호 표시 토글 */
    document.querySelectorAll("[data-reveal]").forEach(function (b) {
      b.addEventListener("click", function () {
        var input = document.getElementById(b.dataset.reveal);
        if (!input) return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        b.innerHTML = ic(show ? "eyeoff" : "eye", 15);
        b.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 표시");
      });
    });
  });
})();

/* 막대 차트 : 대시보드 매출 추이 */
(function () {
  "use strict";

  function niceMax(v) {
    if (v <= 0) return 1;
    var mag = Math.pow(10, Math.floor(Math.log10(v)));
    var step = mag / 2;
    return Math.ceil(v / step) * step;
  }

  function fmt(n) {
    return Number(n).toLocaleString("ko-KR");
  }

  function draw(box) {
    var vals = box.dataset.values.split(",").map(Number);
    var cmp = box.dataset.compare ? box.dataset.compare.split(",").map(Number) : null;
    var labels = box.dataset.labels ? box.dataset.labels.split(",") : null;
    var suffix = box.dataset.suffix || "";
    var today = box.dataset.today ? Number(box.dataset.today) : -1;

    var W = 720,
      H = Number(box.dataset.h || 168),
      padL = 48,
      padR = 6,
      padT = 8,
      padB = 20;
    var iw = W - padL - padR,
      ih = H - padT - padB;
    var max = niceMax(Math.max.apply(null, vals.concat(cmp || [])) * 1.06);
    var n = vals.length;
    var slot = iw / n;
    var y = function (v) {
      return padT + ih - (v / max) * ih;
    };
    var cx = function (i) {
      return padL + (i + 0.5) * slot;
    };

    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" class="chart" aria-label="일별 매출 막대 차트">';

    [0, 0.5, 1].forEach(function (t) {
      var v = max * t,
        yy = y(v);
      s +=
        '<line class="' +
        (t === 0 ? "axis" : "gridline") +
        '" x1="' +
        padL +
        '" x2="' +
        (W - padR) +
        '" y1="' +
        yy +
        '" y2="' +
        yy +
        '"/>';
      s +=
        '<text class="axistext" x="' +
        (padL - 8) +
        '" y="' +
        (yy + 3.5) +
        '" text-anchor="end">' +
        fmt(v) +
        (t === 1 ? suffix : "") +
        "</text>";
    });

    var bw = Math.max(3, slot * 0.58);
    vals.forEach(function (v, i) {
      var hgt = Math.max(1, (v / max) * ih);
      s +=
        '<rect class="bar' +
        (i === today ? " bar--today" : "") +
        '" x="' +
        (cx(i) - bw / 2) +
        '" y="' +
        y(v) +
        '" width="' +
        bw +
        '" height="' +
        hgt +
        '" rx="1.5"><title>' +
        (labels && labels[i] ? labels[i] + "일 " : "") +
        fmt(v) +
        suffix +
        "</title></rect>";
    });

    if (cmp) {
      var dc = cmp
        .map(function (v, i) {
          return (i ? "L" : "M") + cx(i).toFixed(1) + " " + y(v).toFixed(1);
        })
        .join(" ");
      s += '<path class="line--compare" d="' + dc + '"/>';
    }

    if (labels) {
      var every = Number(box.dataset.labelevery || Math.ceil(n / 7));
      labels.forEach(function (t, i) {
        if (i % every !== 0 && i !== n - 1) return;
        s +=
          '<text class="axistext" x="' +
          cx(i) +
          '" y="' +
          (H - 4) +
          '" text-anchor="middle">' +
          t +
          "</text>";
      });
    }

    box.innerHTML = s + "</svg>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-chart]").forEach(draw);
  });
})();
