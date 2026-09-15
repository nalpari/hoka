---
type: Development Procedure
title: Worktrees
description: 명시적으로 요청된 워크트리를 만들고 진입·설정·정리하는 절차.
tags: [development, git, worktrees]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T00:31:50Z }
---

# Worktrees

생성 조건, 플랫폼별 경로, 디렉터리·브랜치 이름 규칙은
[CLAUDE.md](../../CLAUDE.md#worktrees)를 따른다.

# 전제

`hoka/`를 루트로 하는 git 저장소(`main` 브랜치)와 `origin` 원격(`https://github.com/nalpari/hoka.git`)을 쓴다.
절차가 기준으로 삼는 `origin/main`은 첫 푸시 이후에 생긴다.

# 생성과 진입

`EnterWorktree`를 `name`으로 호출하면 위치가 저장소 안 `.claude/worktrees/`로 고정되어
[CLAUDE.md의 경로 규칙](../../CLAUDE.md#worktrees)을 지킬 수 없다. 직접 만든 뒤 `path`로 진입한다.
`path`는 `git worktree list`에 등록된 경로만 받는다.

아래는 macOS / Linux용 예시이고, 저장소 루트(`hoka/`)에서 실행한다. Windows에서는 CLAUDE.md의
Windows 경로를 사용한다.

```bash
git fetch -q origin
git ls-remote --heads origin <포켓몬>    # 출력이 비어 있어야 사용 가능

WT=~/.worktrees/hoka/<관광명소>
git worktree add "$WT" -b <포켓몬> origin/main

# 버전관리 안 되는 설정 파일을 옮긴다. 없는 파일은 건너뛴다.
for f in hoka-fo-front/.env* hoka-bo-front/.env*; do
  [ -f "$f" ] || continue
  mkdir -p "$WT/$(dirname "$f")"
  cp -p "$f" "$WT/$f"
done

# node_modules 는 워크트리로 딸려오지 않는다.
(cd "$WT/hoka-fo-front" && pnpm install --frozen-lockfile)
(cd "$WT/hoka-bo-front" && pnpm install --frozen-lockfile)
```

그 다음 `EnterWorktree`에 `$WT` 경로를 `path`로 넘긴다.

# 복사 대상

**워크트리에서도 앱이 떠야 하므로 추적하지 않는 설정 파일은 같이 복사한다.**
**추적하지 않는 설정 파일을 추가하면 같은 변경에서 위 목록에도 넣는다.**

| 대상 | 처리 | 이유 |
|---|---|---|
| `hoka-*-front/.env*` | 복사 | 프론트 `.gitignore`가 `.env*`를 무시한다. 2026-09-14 기준 실제 파일은 없다. |
| `hoka-*-front/node_modules` | `pnpm install --frozen-lockfile`로 새로 설치 | 추적하지 않는 디렉터리라 딸려오지 않는다. `AGENTS.md`가 읽으라는 `node_modules/next/dist/docs/`도 설치 후에 생긴다. |
| `hoka-*/.claude/settings.local.json` | 복사하지 않음 | 메인 체크아웃의 `okf/`를 절대 경로로 가리킨다. 워크트리에서 쓰면 번들 수정이 메인 체크아웃에 들어간다. 워크트리 루트에서 세션을 시작하면 `okf/`가 작업 디렉터리 안이라 필요 없다. |
| API 설정 | 없음 | `application.yaml`은 추적 중이라 딸려오고, API `.gitignore`가 무시하는 설정 파일은 없다. Maven 의존성은 `~/.m2`를 공유한다. |

# 포트

메인 체크아웃과 워크트리에서 같은 앱을 동시에 띄우면 기본 포트(프론트 3000, API 8080)가 충돌한다.
[System overview](/architecture/system-overview.md) 참고. 워크트리 쪽을 바꿔 띄운다:

```bash
pnpm dev -p 3001
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

# 브랜치 이름

**브랜치 이름은 만들기 전에 반드시 원격과 대조한다.** 이미 있으면 다른 포켓몬을 고른다. 로컬에
같은 이름이 있어도 `git worktree add -b`가 실패하므로 마찬가지로 다른 이름으로 간다.

# 정리

`path`로 진입한 워크트리는 `ExitWorktree`가 지우지 못한다(`keep`만 가능). 작업이 끝나면
`ExitWorktree`의 `keep`으로 나온 뒤 `git worktree remove <경로>`로 직접 정리한다.
