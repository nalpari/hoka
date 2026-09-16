---
type: Project
title: hoka-bo-front
description: 백오피스(관리자용) Next.js 16 웹 앱.
resource: ../../hoka-bo-front/
tags: [frontend, bo, nextjs]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T07:30:00Z }
sources:
  - id: pkg
    resource: ../../hoka-bo-front/package.json
    title: package.json
  - id: next-config
    resource: ../../hoka-bo-front/next.config.ts
    title: next.config.ts
  - id: agents
    resource: ../../hoka-bo-front/AGENTS.md
    title: AGENTS.md (Next.js agent rules)
  - id: pnpm-ws
    resource: ../../hoka-bo-front/pnpm-workspace.yaml
    title: pnpm-workspace.yaml
  - id: design-ref
    resource: ../../hoka-bo-front/ref/design/index.html
    title: 디자인 시안 목록 (ref/design)
---

# Stack

| 항목 | 값 |
|---|---|
| Framework | Next.js 16.3.5 (App Router, `src/app`)[^pkg] |
| UI | React 19.2.8, Tailwind CSS v4, 시안 디자인 시스템 `src/app/hoka.css`(`ref/design/assets/hoka.css` 복사본) |
| Language | TypeScript (strict), alias `@/*` → `src/*` |
| React Compiler | 활성 (`reactCompiler: true`)[^next-config] |
| Package manager | pnpm 11.18.0 (`packageManager`)[^pkg], 빌드 스크립트 허용 목록 `allowBuilds`[^pnpm-ws] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local   # BO_API_BASE_URL 필요. 없으면 API 호출이 실패한다
pnpm dev        # http://localhost:3000 (fo-front와 동시 실행 시 포트 분리 필요)
pnpm build
pnpm lint
```

# Notes

- 이 Next.js 버전은 학습 데이터와 API가 다르다. 코드 작성 전 `node_modules/next/dist/docs/`를 확인한다.[^agents]
- 테스트 러너 미설정.
- `npm install`은 쓰지 않는다. `package-lock.json`이 새로 생긴다.
- [hoka-fo-front](/projects/hoka-fo-front.md)와 스캐폴드는 같지만 더 이상 쌍둥이가 아니다. 로그인·BFF 인증 배관, 시안 스타일시트, `BO_API_BASE_URL` 설정은 BO에만 있다.
- [hoka-bo-api](/projects/hoka-bo-api.md)를 호출한다. 브라우저는 API를 직접 부르지 않고 Next 서버(BFF)만 부른다. 토큰은 HttpOnly 쿠키(`bo_at`·`bo_rt`·`bo_rm`)에 두고 API에는 Bearer로 전달한다. 계약과 규칙은 [BO 인증·권한](/architecture/bo-auth.md).
- `src/proxy.ts`가 보호 라우트를 지킨다(Next 16에서 `middleware`는 `proxy`로 이름이 바뀌었다). 쿠키만 보는 낙관적 검사이고, 실제 검증은 페이지가 `/api/auth/me`로 한다. access 쿠키가 만료돼 사라지면 여기서 refresh로 갱신한다 — 쿠키 쓰기는 Server Action·Route Handler·proxy에서만 되기 때문이다.
- API가 세션을 거절하면 페이지는 `/session/clear`(Route Handler)로 보낸다. 거기서 쿠키를 지우고 `/login?expired=1`로 넘긴다. 곧장 `/login`으로 보내면 proxy가 남은 쿠키를 보고 대시보드로 되돌려 무한 왕복이 되므로, 이 경로만 쿠키가 있어도 통과시킨다.
- 환경변수는 `BO_API_BASE_URL` 하나이고 기본값이 없다. 서버에서만 쓰므로 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 예시는 추적되는 `.env.example`, 실제 값은 `.env.local`.
- 구현된 화면은 `/login`, `/dashboard`, `/menus`(메뉴 관리), `/roles`(권한 관리), `/users`(사용자 관리)다. `/`는 `/dashboard`로 보낸다. 공용 셸(`components/Shell`·`Rail`)은 좌측 레일과 톱바를 그린다.
- **레일은 `me.menus`를 그대로 그린다.** 그룹 제목·순서·아이콘·경로가 모두 API 값이라 `/menus`에서 바꾸면 레일이 따라간다. 시안 `app.js`의 `NAV` 같은 하드코딩 목록은 없다. 아이콘 이름이 세트에 없으면 문서 아이콘으로 대체한다(`isIconName`).
- `/menus`·`/roles`·`/users`는 [hoka-bo-api](/projects/hoka-bo-api.md)의 메뉴·역할·사용자 API에 붙는다. 목록 선택·검색·필터·페이지는 전부 URL searchParams에 두고 서버 컴포넌트가 읽는다. 쓰기는 Server Action이고, 끝나면 `revalidatePath`로 다시 그린다.
- 세 화면 다 조회는 `SYS_MENUS:R`·`SYS_ROLES:R`·`SYS_USERS:R`, 변경은 `SUPER`가 필요하다(API가 강제한다). 그래서 화면은 `me.isSuper`로만 읽기/쓰기를 가른다 — 시드에서 두 메뉴는 `use_read`만 켜져 있어 "수정 권한" 같은 개념이 없다. 슈퍼관리자가 아니면 쓰기 버튼과 선택칸을 아예 그리지 않는다. 메뉴 조회 권한이 없으면 `NoAccess`를 보여 준다.
- `/menus`는 시안 `ref/design/menus.html`을 따르되 세 곳이 다르다. 손잡이 드래그는 **같은 그룹 안 위/아래 버튼**으로 옮겼고(키보드로도 순서를 바꾼다), 시안의 '접근 가능한 역할' 체크박스는 권한 관리 격자와 같은 일이라 **메뉴가 쓰는 동작(`use_*`)과 전용 역할**로 바꿨다. 초안·배포 버전(v13)과 변경 이력은 API가 없어 뺐다.
- 상세 폼은 `action={save}` 대신 `onSubmit`으로 직접 제출한다. `action`으로 넘기면 React가 성공·실패를 가리지 않고 폼을 비워, 경로 중복 같은 이유로 거절당했을 때 입력한 값이 전부 사라진다.
- 아바타는 `components/Avatar.tsx` 하나가 목록·상세·역할 구성원·레일 네 곳을 덮는다. 사진이 없으면 이름 첫 글자다. `<img>`는 API를 직접 못 부르므로 `app/avatar/[id]/route.ts`가 중계하고, 주소에 `?v=<avatarUpdatedAt>`을 붙여 캐시를 무효화한다. 사진 올리기·지우기는 `/users` 상세에 있고 슈퍼관리자이거나 본인일 때만 보인다. 파일을 고르면 바로 올라간다.
- 권한 격자(`app/roles/role-editor.tsx`)만 클라이언트 상태다. 조회(R)를 끄면 등록·수정·삭제가 같이 꺼지고 잠긴다 — API가 `READ_REQUIRED`로 거절할 조합을 만들지 않는다. 저장 전에 다른 역할을 누르면 `<Link onNavigate>`로 막고 스코프바 아래 배너를 띄운다.
- 사용자 상세는 목록 결과와 무관하게 `GET /api/users/{id}`로 부른다. 잠금 해제·비활성화는 그 사용자를 현재 필터에서 밀어내는데, 목록에 있을 때만 상세를 그리면 패널이 사라지면서 **한 번만 보여 주는 임시 비밀번호까지 같이 없어진다**.
- 초대 링크와 임시 비밀번호는 응답 본문에만 있다. 상세·초대 패널의 `.note` 블록에 복사 버튼과 함께 보여 준다. 잃어버리면 다시 초대·다시 초기화하면 된다.
- **사용자 목록(`/users`)의 행은 전부 실제 값이다.** 저장할 곳이 없는 2단계 인증 열은 시안에서 뺐다. 아바타는 올린 사진이 있으면 사진, 없으면 이름 이니셜이다. 컬럼 폭은 고정하지 않고 브라우저 자동 배분에 맡긴다 — `.split`이 1180px에서야 1열로 접혀 그 언저리가 가장 좁은데, 폭을 박아 두면 값이 잘리고 가로 스크롤이 생긴다. 좁을 때는 `최근 접속`이 두 줄로 접힌다.
- 시안에 있지만 저장할 곳도 부를 API도 없어 **아직 합성 자료인 것**: 데이터 범위, 메뉴 트리 버전, 브랜드스토어 스코프칩, 격자 비고 열, 메뉴 영문명·새 창에서 열기, CSV 내보내기·역할 복제·변경 이력 버튼, 목록 정렬, 로그인 이력의 지역. 반대로 **부여 근거 열·접근 가능한 메뉴·로그인 이력의 브라우저명은 실제 값**이다(각각 `menu.exclusiveRoleCode`, 그 사용자 역할의 권한, `user_agent` 파싱).
- 서버 전용 조회는 `lib/bo.ts`, 서버·클라이언트가 같이 쓰는 타입·상태 상수는 `lib/bo-types.ts`로 나눠 둔다. `lib/bo.ts`는 `next/headers`를 끌고 오므로 클라이언트 컴포넌트가 여기서 가져오면 빌드가 깨진다.
- 대시보드의 수치·목록은 시안의 합성 데이터다(`app/dashboard/mock.ts`). 집계 API가 생기면 이 파일을 걷어낸다. 차트는 시안 `app.js`의 `draw()`를 서버 렌더 SVG로 옮긴 `components/SalesChart`다.
- 디자인 시안 7화면(로그인·대시보드·메뉴 관리·사용자 관리·권한 관리·기획전·콘텐츠 목록·기획전 전시 구성)은 `ref/design/`에 정적 HTML로 있다. 공용 토큰·셸은 `ref/design/assets/hoka.css`와 `app.js`다(레일 메뉴는 이제 `app.js`의 `NAV`가 아니라 API가 원본이다). 빌드에 포함되지 않으며 화면 구현 시 참고용이다.[^design-ref]

[^pkg]: package.json
[^next-config]: next.config.ts
[^agents]: AGENTS.md (Next.js agent rules)
[^pnpm-ws]: pnpm-workspace.yaml
[^design-ref]: 디자인 시안 목록 (ref/design/index.html)
