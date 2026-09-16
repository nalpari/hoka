---
type: Project
title: hoka-bo-front
description: 백오피스(관리자용) Next.js 16 웹 앱.
resource: ../../hoka-bo-front/
tags: [frontend, bo, nextjs]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-16T02:00:00Z }
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
- 환경변수는 `BO_API_BASE_URL` 하나이고 기본값이 없다. 서버에서만 쓰므로 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 예시는 추적되는 `.env.example`, 실제 값은 `.env.local`.
- 구현된 화면은 `/login`과 임시 착지 페이지(`/`, `me` 결과 표시)뿐이다. 레일·대시보드는 아직 없다.
- 디자인 시안(로그인·대시보드·메뉴 관리·사용자 관리·권한 관리)은 `ref/design/`에 정적 HTML로 있다. 공용 토큰·셸은 `ref/design/assets/hoka.css`와 `app.js`, 좌측 레일의 메뉴 구조는 `app.js`의 `NAV`가 원본이다. 빌드에 포함되지 않으며 화면 구현 시 참고용이다.[^design-ref]

[^pkg]: package.json
[^next-config]: next.config.ts
[^agents]: AGENTS.md (Next.js agent rules)
[^pnpm-ws]: pnpm-workspace.yaml
[^design-ref]: 디자인 시안 목록 (ref/design/index.html)
