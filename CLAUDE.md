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

### 코드를 바꾸면 같은 변경에서 번들도 고친다

`okf/`는 빌드·테스트·린트 어디에도 걸리지 않는다. 코드만 바뀌고 문서가 그대로면 누군가 믿고 틀릴 때까지
조용히 틀린 채로 남는다. 프로젝트 파일을 수정했으면 작업을 끝내기 전에 아래 표로 영향받는 문서를 찾아 같이 고친다.

| 바꾼 것 | 고칠 곳 |
|---|---|
| 프론트 `package.json`의 프레임워크·라이브러리 버전, 스크립트, `packageManager`, 테스트 러너 추가, `pnpm-workspace.yaml`의 `allowBuilds` | `okf/projects/hoka-*-front.md`의 `# Stack`, `# Commands`, `# Notes` |
| 프론트 `next.config.ts`, `tsconfig.json`의 `paths`, Tailwind 설정 | 같은 문서의 `# Stack` |
| API `pom.xml`의 Spring Boot·Java 버전, starter·DB 드라이버 추가/제거 | `okf/projects/hoka-*-api.md`의 `# Stack` |
| API `application.yaml`의 datasource, `server.port` 등 동작을 바꾸는 설정 | 같은 문서의 `# Stack`(Config 행)과 `# Notes`. 포트면 `okf/architecture/system-overview.md`의 `# Local ports (현재 기본값)`도 |
| 보안 설정(Spring Security 필터 체인, 인증 방식) | API 문서의 `# Notes`. 프론트–API 인증 흐름이 생기면 `system-overview.md`도 |
| 프론트가 API를 호출하는 코드(base URL, 연동 대상) | `system-overview.md`의 `# Assumptions (미검증)`. 코드로 확인된 가정은 본문 사실로 옮기고 목록에서 뺀다 |
| 빌드·실행·테스트 명령 | 해당 프로젝트 문서의 `# Commands`와 이 파일의 명령 블록 |
| 추적하지 않는 설정 파일(`.env*` 등) 추가 | `okf/development/worktrees.md`의 `# 복사 대상` 표 |
| 여러 프로젝트가 공유하는 새 개념(API 엔드포인트 계약, DB 테이블, 도메인 용어) | 새 개념 문서, 그 디렉터리의 `index.md`, `okf/log.md` |

- **FO/BO 쌍 중 한쪽만 바꿨으면** 쌍이 같다고 적은 곳이 아직 맞는지 확인한다: 프론트 두 문서의 "이름 외 설정이 동일한 쌍둥이" 문장, 이 파일 Layout의 "The FO/BO pairs are identical" 줄.
- 문서를 고칠 때 frontmatter(`generated`, `verified`, `status`) 처리는 [OKF authoring](okf/conventions/okf-authoring.md)을 따르고, 고친 뒤 위 적합성 검사를 돌린다.
- 커밋할 때는 코드와 그 문서를 같은 커밋에 넣는다. hoka-cnp 태그 규칙이 `okf/` 파일을 해당 프로젝트 커밋에 붙인다.
- 코드 변경이 번들의 어떤 내용도 틀리게 만들지 않으면 그렇다고 말하고 넘어간다. 타임스탬프만 올리지 않는다.
- Stop hook(`.claude/hooks/okf-sync-check.sh`)이 이 규칙을 확인한다. 프로젝트 파일은 바뀌었는데 `okf/`가 그대로면 응답을 끝내기 전에 한 번 되돌려 보낸다. 같은 변경으로는 세션당 한 번만 알린다.

## Frontends (`hoka-*-front`)

```bash
pnpm install --frozen-lockfile
pnpm dev        # next dev, http://localhost:3000
pnpm build
pnpm lint       # eslint (flat config: next core-web-vitals + typescript)
```

- **Read `AGENTS.md` in each frontend first.** This Next.js version has breaking changes compared with your training data. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/`. `next dev` rewrites that block in `AGENTS.md`, so don't remove it.
- React Compiler is on (`reactCompiler: true` in `next.config.ts`, via `babel-plugin-react-compiler`). Don't add `useMemo`/`useCallback` just to memoize.
- Tailwind v4 has no `tailwind.config`. Theme tokens live in `src/app/globals.css` under `@theme inline`.
- Path alias: `@/*` maps to `src/*`.
- There is no test runner yet.
- pnpm 11 is the package manager (`packageManager: pnpm@11.18.0`, `pnpm-lock.yaml`). Don't run `npm install`; it creates a `package-lock.json`.
- pnpm blocks dependency build scripts by default. The allowlist is `allowBuilds` in each frontend's `pnpm-workspace.yaml` (currently `unrs-resolver`). On `ERR_PNPM_IGNORED_BUILDS`, add the package there as `true`/`false`; `pnpm approve-builds` is interactive and hangs in agent sessions.

## APIs (`hoka-*-api`)

```bash
./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=HokaFoApiApplicationTests             # single test class
./mvnw test -Dtest=HokaFoApiApplicationTests#contextLoads  # single method
./mvnw package
```

- Starters: `webmvc`, `security`, `actuator`, `devtools`, MyBatis (`mybatis-spring-boot-starter` 4.1.0, which brings `spring-boot-starter-jdbc`), plus the PostgreSQL runtime driver.
- Spring Security is configured in `config/SecurityConfig`: every request needs HTTP Basic auth with Spring's generated default user (`user`, password printed at startup), sessions are stateless, and CSRF is off.
- Sample CRUD lives in the `sample` package (`/api/samples`, MyBatis XML at `mapper/SampleMapper.xml`). `SampleControllerTests` hits the real local `appdb`, so `./mvnw test` needs the DB running.
- Config is `src/main/resources/application.yaml`, which sets `spring.application.name`, the datasource (env vars `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`, defaulting to `jdbc:postgresql://localhost:5432/appdb` with `app`/`app`), and MyBatis (mapper XML at `classpath:mapper/**/*.xml`, underscore-to-camelCase on). `@Mapper` interfaces are auto-scanned under the application package.
- No `server.port` is set, so both APIs default to 8080. Both frontends also default to 3000. To run FO and BO at the same time, set different ports.

## Do Always

- 모든 대화에서 추론과정과 결과는 한국어로 보여줘.