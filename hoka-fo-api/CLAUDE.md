# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Shared knowledge (OKF)

네 프로젝트 공유 지식 번들 `../okf/` (OKF v0.2). 규칙과 진입점:

@../okf/conventions/okf-authoring.md
@../okf/index.md

## API 코드 작성 규칙

API 코드를 쓰거나 고치기 전에 `../okf/conventions/index.md`에서 관련 규칙을 찾아 읽고 따른다. 규칙과 다르게
구현해야 하면 먼저 사용자에게 알리고, 바꾼 규칙은 같은 변경에서 okf 문서에도 반영한다.

- DB·외부 호출에 재시도·차단(Retry, CircuitBreaker)을 넣거나 fallback·예외 설정을 바꿀 때: `../okf/conventions/resilience4j.md`
