---
type: Project
title: hoka-bo-front
description: 백오피스(관리자용) Next.js 16 웹 앱.
resource: ../../hoka-bo-front/
tags: [frontend, bo, nextjs]
status: draft
generated: { by: claude-code/claude-fable-5-1, at: 2026-09-15T06:25:00Z }
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
| UI | React 19.2.8, Tailwind CSS v4 |
| Language | TypeScript (strict), alias `@/*` → `src/*` |
| React Compiler | 활성 (`reactCompiler: true`)[^next-config] |
| Package manager | pnpm 11.18.0 (`packageManager`)[^pkg], 빌드 스크립트 허용 목록 `allowBuilds`[^pnpm-ws] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
pnpm install --frozen-lockfile
pnpm dev        # http://localhost:3000 (fo-front와 동시 실행 시 포트 분리 필요)
pnpm build
pnpm lint
```

# Notes

- 이 Next.js 버전은 학습 데이터와 API가 다르다. 코드 작성 전 `node_modules/next/dist/docs/`를 확인한다.[^agents]
- 테스트 러너 미설정.
- `npm install`은 쓰지 않는다. `package-lock.json`이 새로 생긴다.
- [hoka-fo-front](/projects/hoka-fo-front.md)와 이름 외 설정이 동일한 쌍둥이 프로젝트.
- 백엔드 연동 대상으로 [hoka-bo-api](/projects/hoka-bo-api.md)를 가정한다(아직 연동 코드 없음). [System overview](/architecture/system-overview.md) 참고.
- 디자인 시안(로그인·대시보드·메뉴 관리·사용자 관리·권한 관리)은 `ref/design/`에 정적 HTML로 있다. 공용 토큰·셸은 `ref/design/assets/hoka.css`와 `app.js`, 좌측 레일의 메뉴 구조는 `app.js`의 `NAV`가 원본이다. 빌드에 포함되지 않으며 화면 구현 시 참고용이다.[^design-ref]

[^pkg]: package.json
[^next-config]: next.config.ts
[^agents]: AGENTS.md (Next.js agent rules)
[^pnpm-ws]: pnpm-workspace.yaml
[^design-ref]: 디자인 시안 목록 (ref/design/index.html)
