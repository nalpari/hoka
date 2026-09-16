"use client";

import { useState } from "react";

import { Icon } from "./Icon";

// 960px 이하에서 레일은 화면 밖으로 밀려 있고 body.rail-open으로 열린다(hoka.css).
// 여는 방법이 없으면 좁은 화면에서 메뉴에 닿을 수 없어 이 버튼만 클라이언트로 둔다.
export function RailToggle() {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((was) => {
      document.body.classList.toggle("rail-open", !was);
      return !was;
    });
  };

  return (
    <button
      className="btn btn--ghost btn--icon btn--sm railtoggle"
      type="button"
      onClick={toggle}
      aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
      aria-expanded={open}
    >
      <Icon name={open ? "x" : "menu"} size={16} />
    </button>
  );
}
