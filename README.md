# HOKA

프론트오피스(고객용)와 백오피스(관리자용)가 각각 Next.js 프론트와 Spring Boot API 한 쌍으로 이뤄지고,
셸에서 실행하는 Spring Batch jar가 하나 붙은 모노레포다. 모든 프로젝트가 스캐폴딩 직후 상태라 아직 비즈니스 코드는 없다.

## 구성


| 디렉터리                              | 역할                            | 스택                                                                     |
| --------------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| [`hoka-fo-front`](hoka-fo-front/) | 프론트오피스 UI                     | Next.js 16.3.5 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript |
| [`hoka-bo-front`](hoka-bo-front/) | 백오피스 UI                       | 위와 동일                                                                  |
| [`hoka-fo-api`](hoka-fo-api/)     | 프론트오피스 API (`com.hoka.fo`)    | Spring Boot 4.1.1, Java 21, Maven                                      |
| [`hoka-bo-api`](hoka-bo-api/)     | 백오피스 API (`com.hoka.bo`)      | 위와 동일                                                                  |
| [`hoka-batch`](hoka-batch/)       | 셸에서 `java -jar`로 실행하는 배치 (`com.hoka.batch`) | Spring Boot 4.1.1 + Spring Batch 6, Java 21, Maven                     |
| [`okf`](okf/)                     | 프로젝트가 공유하는 지식 문서 (OKF v0.2) | Markdown                                                               |


- 루트는 git 저장소일 뿐 빌드가 아니다. **명령은 각 프로젝트 디렉터리 안에서 실행한다.**
- FO/BO 쌍은 같은 스캐폴딩에서 출발했지만 지금은 다르다. 백오피스에만 로그인·권한 기능이 들어가 있다.
  한쪽만 바꾸는 변경이 아니면 두 쪽을 같이 맞춘다.
- 각 프론트가 같은 영역의 API를 호출한다는 연결은 아직 가정이다. 연동 코드는 없다.

## 처음 설치하기 (Claude Code 기준)

macOS + [Homebrew](https://brew.sh) 기준이다. 위에서부터 순서대로 실행한다. 이미 설치된 도구는 건너뛴다.
확인된 환경: Node 24.15, pnpm 11.18, OpenJDK 21.0.11, graft 0.18.0.


| 도구                                                         | 용도                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Node.js 24 / npm                                           | Claude Code 훅·상태줄 스크립트(`.claude/helpers/*.cjs`), graft CLI 전역 설치    |
| pnpm 11                                                    | 프론트 패키지 매니저 (`pnpm-lock.yaml`)                                         |
| JDK 21                                                     | API·배치 빌드. Maven은 `./mvnw`가 받아 쓰므로 따로 설치하지 않는다                        |
| jq                                                         | Stop 훅 `okf-sync-check.sh`. 없으면 훅이 조용히 건너뛴다                        |
| [uv](https://docs.astral.sh/uv/)                           | `okf/` 적합성 검사                                                      |
| [Claude Code](https://docs.claude.com/en/docs/claude-code) | 에이전트 CLI                                                           |
| [graft](https://www.npmjs.com/package/@nanonets/graft)     | 코드 그래프. MCP 서버·훅·스킬이 이 CLI를 부른다                                    |


### 1. 기본 도구

```bash
# Node.js 24 (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 24

# pnpm (프론트 package.json의 packageManager와 같은 버전)
npm install -g pnpm@11.18.0

# JDK 21, jq, uv
brew install openjdk@21 jq uv
echo 'export PATH="$(brew --prefix openjdk@21)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 확인
node -v && pnpm -v && java -version && jq --version && uv --version
```

### 2. Claude Code

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version
```

### 3. graft CLI

`graft`를 `PATH`에서 찾는다. `.mcp.json`의 MCP 서버와 `.claude/settings.json`의 훅·상태줄이 여기에 해당한다.
nvm을 쓰면 **1단계에서 설치한 Node 24가 활성화된 셸에서** 전역 설치한다.

```bash
DO_NOT_TRACK=1 npm install -g @nanonets/graft
graft --version
```

### 4. 저장소 클론과 의존성 설치

```bash
git clone https://github.com/nalpari/hoka.git
cd hoka

(cd hoka-fo-front && pnpm install --frozen-lockfile)
(cd hoka-bo-front && pnpm install --frozen-lockfile)
(cd hoka-fo-api && ./mvnw -q dependency:go-offline)
(cd hoka-bo-api && ./mvnw -q dependency:go-offline)
(cd hoka-batch && ./mvnw -q dependency:go-offline)
```

### 5. graft 그래프 생성

`graft/` 디렉터리는 로컬 캐시라 git에 없다. 클론한 뒤 한 번 만든다. API 키가 필요 없고 비용도 들지 않는다.
이후에는 훅이 편집할 때마다 갱신한다.

```bash
graft build
```

`graft init`은 이미 적용돼 커밋되어 있으니 다시 실행하지 않는다. 다시 실행하면 `.claude/helpers/*.cjs`에
자기 PC 경로가 새겨져 불필요한 diff가 생긴다. 이 경로를 못 찾아도 헬퍼는 `npm root -g`로 graft를 찾는다.

### 6. Claude Code 실행

```bash
claude
```

- 처음 실행하면 프로젝트 MCP 서버 `graft`(`.mcp.json`)를 허용할지 묻는다. 허용한다.
- `/mcp`로 `graft`가 connected인지 확인한다.
- 프로젝트 스킬 `/hoka-cnp`(커밋·푸시)와 `graft`는 `.claude/skills/`에 들어 있어 따로 설치하지 않는다.

## 시작하기

### 프론트 (`hoka-fo-front`, `hoka-bo-front`)

```bash
cd hoka-fo-front
pnpm install --frozen-lockfile
pnpm dev          # http://localhost:3000
pnpm build
pnpm start        # build 결과 실행
pnpm lint         # ESLint flat config (next core-web-vitals + typescript)
```

- 테스트 러너는 아직 없다.
- **패키지 매니저는 pnpm이다** (`packageManager: pnpm@11.18.0`, `pnpm-lock.yaml`). `npm install`은 `package-lock.json`을 새로 만들므로 쓰지 않는다.
  의존성 추가는 `pnpm add <pkg>`, 개발 의존성은 `pnpm add -D <pkg>`.
- pnpm은 의존성의 설치 스크립트를 기본으로 막는다. 허용 목록은 각 프론트의 `pnpm-workspace.yaml`의 `allowBuilds`다(현재 `unrs-resolver`).
  설치 중 `ERR_PNPM_IGNORED_BUILDS`가 나오면 그 패키지를 `true`/`false`로 추가하고 다시 `pnpm install`한다.
- **이 Next.js 버전은 이전 버전과 API가 다르다.** 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 문서를 확인한다.
- React Compiler가 켜져 있다(`next.config.ts`의 `reactCompiler: true`). 메모이제이션만을 위한 `useMemo`/`useCallback`은 넣지 않는다.
- Tailwind v4라 `tailwind.config`가 없다. `hoka-fo-front`의 테마 토큰은 `src/app/globals.css`의 `@theme inline`에 있고,
  `hoka-bo-front`는 디자인 시스템 `src/app/hoka.css`가 토큰과 컴포넌트 클래스를 갖는다.
- 경로 별칭 `@/*` → `src/*`.
- `.env*` 파일은 git이 무시한다. `hoka-bo-front`는 `.env.local`에 `BO_API_BASE_URL`이 필요하다(추적되는 `.env.example` 참고).
  기본값이 없어서 없으면 API를 부르지 못한다. `hoka-fo-front`는 아직 필요한 환경 변수가 없다.

### API (`hoka-fo-api`, `hoka-bo-api`)

```bash
cd hoka-fo-api
./mvnw spring-boot:run                                      # http://localhost:8080
./mvnw test
./mvnw test -Dtest=HokaFoApiApplicationTests                # 테스트 클래스 하나
./mvnw test -Dtest=HokaFoApiApplicationTests#contextLoads   # 메서드 하나
./mvnw package
```

```bash
cd hoka-bo-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=local     # 프로파일을 빼면 환경변수가 없어 기동에 실패한다
./mvnw test                                                 # Testcontainers: Docker가 떠 있어야 한다
./mvnw test -Dtest=HokaBoApiApplicationTests#contextLoads
./mvnw package
```

**두 API는 더 이상 같지 않다.** 공통점과 차이는 다음과 같다.

- 설정 파일은 둘 다 `src/main/resources/application.yaml`이고 `spring.application.name`, datasource(환경변수 `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`), MyBatis 설정이 있다.
  FO는 이 환경변수에 기본값(`jdbc:postgresql://localhost:5432/appdb`, `app`/`app`)이 있고, **BO는 기본값이 없다.**
  BO의 로컬 값은 `application-local.yaml`에 있어서 `local` 프로파일로 띄워야 하고, 다른 환경은 환경변수로 채운다
  (`DB_*` 외에 `BO_JWT_SECRET`, `BO_ADMIN_EMAIL`/`BO_ADMIN_PASSWORD`, `BO_FRONT_BASE_URL`).
- 공통 Starter: `webmvc`, `security`, `actuator`, `devtools`, MyBatis(`mybatis-spring-boot-starter` 4.1.0)와 PostgreSQL 드라이버.
  FO는 `aspectj`와 Resilience4j가, BO는 `oauth2-resource-server`, Flyway, springdoc, Testcontainers가 더 있다.
- **인증 방식이 다르다**(둘 다 세션 없음·CSRF 끔, `config/SecurityConfig`).
  - FO는 HTTP Basic이고 사용자 이름은 `user`, 비밀번호는 기동할 때마다 콘솔에 `Using generated security password: ...`로 찍힌다.
    ```bash
    curl -u user:<비밀번호> http://localhost:8080/actuator/health
    curl -u user:<비밀번호> http://localhost:8080/api/samples
    ```
  - BO는 JWT 리소스 서버다. 로그인·갱신·로그아웃, 초대, `/actuator/health`만 공개이고 나머지는 Bearer 토큰이 필요하다.
    첫 슈퍼관리자는 기동할 때 만들어진다(`local` 기본값 `admin@hoka.co.kr` / `admin1234!`).
    ```bash
    curl -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' \
      -d '{"email":"admin@hoka.co.kr","password":"admin1234!","rememberMe":false}'
    curl -H "Authorization: Bearer <accessToken>" http://localhost:8080/api/auth/me
    ```
    계약은 [`okf/architecture/bo-auth.md`](okf/architecture/bo-auth.md), 스키마는 [`docs/bo-api/`](docs/bo-api/)에 있다.
- 샘플 CRUD `/api/samples`(`sample` 테이블)는 **FO에만 있다.** `SampleControllerTests`가 로컬 `appdb`에 실제로 접속하므로 FO의 `./mvnw test` 전에는 DB가 떠 있어야 한다.
  BO의 테스트는 Testcontainers가 빈 PostgreSQL을 띄우므로 로컬 `appdb`를 건드리지 않고, 대신 Docker가 필요하다.
- BO는 스키마를 Flyway로 관리한다(`src/main/resources/db/migration`, 이력 테이블 `bo_flyway_schema_history`, 테이블 접두사 `bo_`).
  Swagger UI는 `local`에서만 열린다(<http://localhost:8080/swagger-ui.html>).

### 배치 (`hoka-batch`)

```bash
cd hoka-batch
./mvnw test                                    # Testcontainers로 PostgreSQL을 띄우므로 Docker가 떠 있어야 한다
./mvnw package                                 # target/hoka-batch.jar

bin/run-job.sh sampleJob 2026-09-14            # 날짜를 빼면 Asia/Seoul 기준 어제 (GNU date 필요, macOS는 날짜를 넘긴다)
bin/run-job.sh --recover sampleJob 2026-09-14  # kill -9 등으로 멈춘 실행을 FAILED로 표시
```

- Spring Batch 6. job 여러 개를 jar 하나에 두고 `--spring.batch.job.name`으로 고른다. job은 `targetDate=yyyy-MM-dd`를 필수로 받는다.
- 이미 성공한 날짜를 다시 실행하면 거부되고(종료 코드 1), 실패한 날짜는 실패한 step부터 이어서 실행된다.
- DB 설정은 API와 같다. 실행 이력 테이블(`BATCH_*`)은 로컬 `appdb`에 처음 실행할 때 자동으로 만들어진다.
- 종료 코드, cron 예시, 비정상 종료 복구 절차는 [`okf/projects/hoka-batch.md`](okf/projects/hoka-batch.md)에 있다.

## 여러 앱 동시에 띄우기

설정된 포트가 없어 기본값이 겹친다. 프론트 두 개는 모두 3000, API 두 개는 모두 8080이다.
같은 종류를 함께 띄울 때는 한쪽 포트를 바꾼다.

```bash
# hoka-bo-front
pnpm dev -p 3001

# hoka-bo-api
./mvnw spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.arguments=--server.port=8081
```

## 공유 지식 문서 (`okf/`)

API 계약, 도메인 용어, 아키텍처 결정처럼 여러 프로젝트에 걸친 사실은
[`okf/`](okf/index.md)에 [OKF v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format) 형식으로 적는다.


| 문서                                                                           | 내용                   |
| ---------------------------------------------------------------------------- | -------------------- |
| [`okf/projects/`](okf/projects/index.md)                                     | 프로젝트별 스택, 명령, 현재 상태  |
| [`okf/architecture/system-overview.md`](okf/architecture/system-overview.md) | 구성 요소, 미검증 가정, 로컬 포트 |
| [`okf/development/worktrees.md`](okf/development/worktrees.md)               | 워크트리 생성·정리 절차        |
| [`okf/conventions/okf-authoring.md`](okf/conventions/okf-authoring.md)       | 문서 작성 규칙             |


**코드를 바꾸면 영향받는 문서를 같은 커밋에서 고친다.** `okf/`는 빌드나 테스트에 걸리지 않아서
틀려도 아무도 모른다. 어떤 변경이 어떤 문서에 영향을 주는지는 [CLAUDE.md](CLAUDE.md)의
"코드를 바꾸면 같은 변경에서 번들도 고친다" 표를 본다. 문서를 고친 뒤 적합성 검사를 돌린다.

```bash
uv run --with pyyaml python okf/.okf/okf_check.py okf
```

## 커밋 규칙

```
<type>:[<태그>] <한글 subject>

<한글 body (선택)>
```

- **type:** `feat` `fix` `refactor` `style` `docs` `chore` `test`
- **태그:** 커밋에 담긴 파일의 최상위 디렉터리로 정한다.
`hoka-fo-front`, `hoka-bo-front`, `hoka-fo-api`, `hoka-bo-api`, `hoka-batch` 중 하나이고, 루트 파일(`okf/`, `.claude/`, `README.md` 등)만 있으면 `common`이다.
프로젝트 파일에 함께 들어간 루트 파일은 그 프로젝트 태그를 따른다.
- **두 프로젝트 이상을 한 커밋에 섞지 않는다.** FO/BO에 같은 변경을 넣어도 커밋을 나눈다.
- `:`와 `[` 사이에는 공백이 없고 `]` 뒤에 공백 하나를 둔다. subject는 태그까지 포함해 50자 이내로 쓴다.

```
feat:[hoka-fo-api] JWT 기반 사용자 인증 추가
docs:[common] 워크트리 절차 문서 경로 수정
```

전체 규칙은 [`.claude/skills/hoka-cnp/SKILL.md`](.claude/skills/hoka-cnp/SKILL.md)에 있다.
Claude Code에서는 `/hoka-cnp`로 이 규칙대로 커밋하고 푸시할 수 있다.

## 커밋하지 않는 파일

- `**/.claude/settings.local.json`: 이 PC의 절대 경로가 들어 있다
- `hoka-*-front/.env*`
- `**/.agent/`

## Claude Code 사용 시

- 루트 [CLAUDE.md](CLAUDE.md)와 각 프로젝트의 `CLAUDE.md`가 에이전트 지침이다. 프론트는 `AGENTS.md`도 읽힌다.
`AGENTS.md`의 Next.js 블록은 `next dev`가 다시 쓰므로 지우지 않는다.
- Stop 훅 [`.claude/hooks/okf-sync-check.sh`](.claude/hooks/okf-sync-check.sh)가 응답을 끝내기 전에
프로젝트 파일은 바뀌었는데 `okf/`가 그대로인지 확인한다. 동작하려면 `jq`가 필요하다.
- graft 훅(`.claude/helpers/graft-hooks.cjs`)은 세션 시작, 프롬프트 제출, 편집 후에 그래프를 갱신하고 컨텍스트를 붙인다.
graft CLI가 없으면 아무 일도 하지 않으므로 [처음 설치하기](#처음-설치하기-claude-code-기준) 3단계를 확인한다.
- 워크트리는 명시적으로 요청할 때만 만든다. 위치는 `~/.worktrees/hoka/<관광명소>`, 브랜치 이름은 포켓몬으로 짓는다.
절차는 [`okf/development/worktrees.md`](okf/development/worktrees.md)를 따른다.

