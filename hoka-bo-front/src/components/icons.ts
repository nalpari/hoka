// 시안(ref/design/assets/app.js)의 아이콘 세트를 그대로 옮겼다.
// 24×24 그리드, stroke 1.5, round cap/join. 값은 <svg> 안에 그대로 들어가는 정적 마크업이다.
export const ICON_PATHS = {
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
  external: '<path d="M14.2 4.4h5.4v5.4"/><path d="M19.6 4.4 11 13"/><path d="M18 14.3v5.3H4.4V6h5.4"/>',
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
} as const;

export type IconName = keyof typeof ICON_PATHS;

// 메뉴 아이콘은 DB에 문자열로 들어 있어 세트에 없는 이름이 올 수 있다.
export function isIconName(value: string | null): value is IconName {
  return value !== null && value in ICON_PATHS;
}
