---
type: Convention
title: OKF authoring
description: HOKA 공유 지식 번들(OKF v0.2)을 읽고 쓰는 규칙.
resource: https://raw.githubusercontent.com/GoogleCloudPlatform/open-knowledge-format/main/SPEC.md
tags: [okf, convention]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-14T09:00:56Z }
sources:
  - id: okf-spec
    resource: https://raw.githubusercontent.com/GoogleCloudPlatform/open-knowledge-format/main/SPEC.md
    title: Open Knowledge Format Specification v0.2
  - id: okf-blog
    resource: https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
    title: How the Open Knowledge Format can improve data sharing
---

# Location

번들 루트는 `hoka/okf/`이며 네 프로젝트에서 `../okf/`로 접근한다. 여러 프로젝트에 걸친 지식(API 계약, 도메인 용어, 공통 규칙, 아키텍처 결정)은 개별 프로젝트가 아니라 이 번들에 기록한다.

# Reading

1. 루트 [index.md](/index.md)에서 시작해 하위 `index.md`를 따라 필요한 개념만 연다(progressive disclosure).
2. `status: draft` 또는 `verified`가 없는 문서는 미검증으로 취급하고, 결정 전에 코드로 확인한다.
3. `stale_after`가 지난 문서는 오래된 정보로 취급한다.

# Writing

- 개념 1개 = `.md` 파일 1개. 파일명은 kebab-case. `index.md`, `log.md`는 예약 파일이므로 개념으로 쓰지 않는다.[^okf-spec]
- frontmatter의 `type`은 필수. `title`, `description`도 채운다. 현재 사용하는 type: `Project`, `Architecture`, `Convention`, `Development Procedure`. 새 type이 필요하면 추가해도 된다.
- 에이전트가 작성하면 `generated: { by: claude-code/<model>, at: <ISO 8601> }`와 `status: draft`를 붙인다. 사람이 검토하면 `verified: { by: human:<id>, at: ... }`를 추가하고 `status: stable`로 바꾼다.
- 기존 문서를 고치면 `generated.at`을 고친 시각으로 바꾸고 `verified` 항목은 지운다. 바뀌기 전 내용을 검증한 기록이라 새 내용을 보증하지 않는다. 에이전트가 고쳤으면 `status: stable`도 `draft`로 되돌린다.
- 근거는 `sources`에 기록하고, 본문 주장은 `[^id]` 각주로 연결한다. 프로젝트 파일은 `../../hoka-fo-api/pom.xml`처럼 상대 경로로 가리킨다.
- 개념 간 링크는 번들 기준 절대 경로(`/projects/hoka-fo-api.md`)를 쓴다. 관계의 종류(호출, 의존 등)는 문장으로 설명한다.
- 개념을 추가·삭제하면 해당 디렉터리 `index.md`에 `* [Title](file.md) - description` 줄을 갱신하고, 루트 [log.md](/log.md) 맨 위 날짜 섹션에 기록한다.
- frontmatter는 루트 `index.md`의 `okf_version` 외에는 `index.md`에 넣지 않는다.

[^okf-spec]: Open Knowledge Format Specification v0.2
