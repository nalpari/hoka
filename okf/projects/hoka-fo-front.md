---
type: Project
title: hoka-fo-front
description: 프론트오피스(고객용) Next.js 16 웹 앱.
resource: ../../hoka-fo-front/
tags: [frontend, fo, nextjs]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T00:31:50Z }
sources:
  - id: pkg
    resource: ../../hoka-fo-front/package.json
    title: package.json
  - id: next-config
    resource: ../../hoka-fo-front/next.config.ts
    title: next.config.ts
  - id: agents
    resource: ../../hoka-fo-front/AGENTS.md
    title: AGENTS.md (Next.js agent rules)
  - id: pnpm-ws
    resource: ../../hoka-fo-front/pnpm-workspace.yaml
    title: pnpm-workspace.yaml
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
pnpm dev        # http://localhost:3000
pnpm build
pnpm lint
```

# Notes

- 이 Next.js 버전은 학습 데이터와 API가 다르다. 코드 작성 전 `node_modules/next/dist/docs/`를 확인한다.[^agents]
- 테스트 러너 미설정.
- `npm install`은 쓰지 않는다. `package-lock.json`이 새로 생긴다.
- [hoka-bo-front](/projects/hoka-bo-front.md)와 스캐폴드 설정은 같지만, BO에는 로그인·BFF 인증 배관과 시안 스타일시트가 추가돼 더 이상 동일하지 않다. FO는 아직 스캐폴드 상태다.
- 백엔드 연동 대상으로 [hoka-fo-api](/projects/hoka-fo-api.md)를 가정한다(아직 연동 코드 없음). [System overview](/architecture/system-overview.md) 참고.

[^pkg]: package.json
[^next-config]: next.config.ts
[^agents]: AGENTS.md (Next.js agent rules)
[^pnpm-ws]: pnpm-workspace.yaml
