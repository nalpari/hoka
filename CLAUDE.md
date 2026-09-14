# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

The root is the git repository but not a build. It holds four separate projects, all freshly scaffolded with no business code yet:

| Project | Stack | Role |
|---|---|---|
| `hoka-fo-front` | Next.js 16.3 (App Router), React 19.2, Tailwind v4, TypeScript | Front office (customer-facing) UI |
| `hoka-bo-front` | same as above | Back office (admin) UI |
| `hoka-fo-api` | Spring Boot 4.1.1, Java 21, Maven | Front office API (`com.hoka.fo`) |
| `hoka-bo-api` | same as above | Back office API (`com.hoka.bo`) |

- The FO/BO pairs are identical apart from their names. Keep them in step unless a change is meant for only one side.
- Each project has its own build. Run commands from inside that project's directory.
- Git: one repository rooted here (branch `main`, remote `origin` = `https://github.com/nalpari/hoka.git`). The projects have no `.git` of their own. `origin/main`, which the [worktree policy](#worktrees) branches from, exists only after the first push.

## Worktrees

**사용자가 명시적으로 요청할 때만 만든다.** 브랜치를 새로 파거나 기능 작업을 해달라는 요청은
평소대로 git으로 처리한다.

| 플랫폼 | 위치 |
| --- | --- |
| Windows | `C:\workspace\.worktrees\hoka\<관광명소>` |
| macOS / Linux | `~/.worktrees/hoka/<관광명소>` |

- **워크트리 디렉터리 이름은 세계 관광명소**, 소문자 kebab-case: `machu-picchu`, `santorini`, `angkor-wat`
- **브랜치 이름은 포켓몬**, 소문자: `snorlax`, `gengar`, `lapras`

워크트리 생성·진입·정리 전에 [워크트리 절차](okf/development/worktrees.md)를 읽는다.
추적하지 않는 설정 파일을 추가하면 같은 변경에서 그 문서의 복사 목록도 갱신한다.

## Shared knowledge (`okf/`)

`okf/` is an [OKF v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format) bundle shared by all four projects. Each project's `CLAUDE.md` imports `../okf/index.md` and `../okf/conventions/okf-authoring.md`. Cross-project facts (API contracts, domain terms, architecture decisions) go there, following the authoring convention. Check conformance with:

```bash
uv run --with pyyaml python okf/.okf/okf_check.py okf
```

## Frontends (`hoka-*-front`)

```bash
npm run dev     # next dev, http://localhost:3000
npm run build
npm run lint    # eslint (flat config: next core-web-vitals + typescript)
```

- **Read `AGENTS.md` in each frontend first.** This Next.js version has breaking changes compared with your training data. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/`. `next dev` rewrites that block in `AGENTS.md`, so don't remove it.
- React Compiler is on (`reactCompiler: true` in `next.config.ts`, via `babel-plugin-react-compiler`). Don't add `useMemo`/`useCallback` just to memoize.
- Tailwind v4 has no `tailwind.config`. Theme tokens live in `src/app/globals.css` under `@theme inline`.
- Path alias: `@/*` maps to `src/*`.
- There is no test runner yet.
- npm is the package manager (`package-lock.json`).

## APIs (`hoka-*-api`)

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=HokaFoApiApplicationTests             # single test class
./mvnw test -Dtest=HokaFoApiApplicationTests#contextLoads  # single method
./mvnw package
```

- Starters: `webmvc`, `security`, `actuator`, `devtools`, plus the PostgreSQL runtime driver. No JPA or JDBC starter is added yet, so the driver does nothing until one is added and a datasource is configured.
- Spring Security is on the classpath with no custom config. Every endpoint therefore requires auth, using Spring's generated default user.
- Config is `src/main/resources/application.yaml`, which currently sets only `spring.application.name`.
- No `server.port` is set, so both APIs default to 8080. Both frontends also default to 3000. To run FO and BO at the same time, set different ports.

## Do Always

- 모든 대화에서 추론과정과 결과는 한국어로 보여줘.