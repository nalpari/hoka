---
type: Project
title: hoka-fo-front
description: 프론트오피스(고객용) Next.js 16 웹 앱.
resource: ../../hoka-fo-front/
tags: [frontend, fo, nextjs]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-14 }
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
---

# Stack

| 항목 | 값 |
|---|---|
| Framework | Next.js 16.3.5 (App Router, `src/app`)[^pkg] |
| UI | React 19.2.8, Tailwind CSS v4 |
| Language | TypeScript (strict), alias `@/*` → `src/*` |
| React Compiler | 활성 (`reactCompiler: true`)[^next-config] |
| Package manager | npm |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

# Notes

- 이 Next.js 버전은 학습 데이터와 API가 다르다. 코드 작성 전 `node_modules/next/dist/docs/`를 확인한다.[^agents]
- 테스트 러너 미설정.
- [hoka-bo-front](/projects/hoka-bo-front.md)와 이름 외 설정이 동일한 쌍둥이 프로젝트.
- 백엔드 연동 대상으로 [hoka-fo-api](/projects/hoka-fo-api.md)를 가정한다(아직 연동 코드 없음). [System overview](/architecture/system-overview.md) 참고.

[^pkg]: package.json
[^next-config]: next.config.ts
[^agents]: AGENTS.md (Next.js agent rules)
