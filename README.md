# HOKA

프론트오피스(고객용)와 백오피스(관리자용)가 각각 Next.js 프론트와 Spring Boot API 한 쌍으로 이뤄지고,
셸에서 실행하는 Spring Batch jar가 하나 붙은 모노레포다. 백오피스는 로그인과 사용자·역할·메뉴 관리가 동작하고,
프론트오피스는 아직 스캐폴딩 직후 상태다.

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
- `hoka-bo-front`는 자기 Next 서버(BFF)를 거쳐 `hoka-bo-api`를 호출한다. 브라우저가 API를 직접 부르지 않는다.
  `hoka-fo-front`가 `hoka-fo-api`를 호출한다는 것은 이름에서 추론한 가정일 뿐이고, FO에는 아직 연동 코드가 없다.

## 처음 설치하기 (Claude Code 기준)

위에서부터 순서대로 실행한다. 각 단계에서 **자기 OS 블록만** 실행하고, 이미 설치된 도구는 건너뛴다.
**3단계(graft CLI)와 6단계의 graft 부분은 선택이다.** 건너뛰어도 빌드·테스트·실행은 전부 정상이고,
에이전트가 코드를 찾을 때 파일을 더 읽을 뿐이다.
macOS는 [Homebrew](https://brew.sh), Windows는 Windows 10 1809+/11에 기본으로 들어 있는
[winget](https://learn.microsoft.com/windows/package-manager/winget/)을 쓴다.

실제로 확인한 환경은 macOS다(Node 24.15, pnpm 11.18, OpenJDK 21.0.11, graft 0.18.0).
Windows 절차는 같은 버전을 winget으로 설치하도록 옮긴 것이고, 아직 그대로 돌려본 적은 없다.


| 도구                                                         | 용도                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| Node.js 24 / npm                                           | 프론트 실행·빌드(pnpm이 이 위에서 돈다). graft를 쓰면 그 CLI와 훅·상태줄 스크립트도 여기서 돈다 |
| pnpm 11                                                    | 프론트 패키지 매니저 (`pnpm-lock.yaml`)                                         |
| JDK 21                                                     | API·배치 빌드. Maven은 `./mvnw`가 받아 쓰므로 따로 설치하지 않는다                        |
| [Docker](https://docs.docker.com/get-started/get-docker/)  | 로컬 PostgreSQL(5단계). `hoka-bo-api`·`hoka-batch` 테스트도 Testcontainers로 DB를 띄우므로 필요하다 |
| jq                                                         | Stop 훅 `okf-sync-check.sh`. 없으면 훅이 조용히 건너뛴다                        |
| [uv](https://docs.astral.sh/uv/)                           | `okf/` 적합성 검사                                                      |
| [Claude Code](https://docs.claude.com/en/docs/claude-code) | 에이전트 CLI                                                           |
| [graft](https://www.npmjs.com/package/@nanonets/graft) **(선택)** | 코드 그래프. 에이전트가 파일을 덜 읽고 코드를 찾게 해 준다. 없어도 모든 빌드·테스트·실행은 그대로 된다 |
| [Git for Windows](https://git-scm.com/downloads/win) (Windows만) | Git과 Git Bash. Stop 훅 `okf-sync-check.sh`와 `hoka-batch/bin/run-job.sh`가 bash 스크립트라 필요하다 |


### 1. 기본 도구

**macOS**

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

**Windows (PowerShell)**

관리자 권한은 필요 없다. `winget install`은 한 번에 하나씩 받는다.

```powershell
winget install -e --id OpenJS.NodeJS.LTS                # Node.js 24 LTS
winget install -e --id EclipseAdoptium.Temurin.21.JDK   # JDK 21
winget install -e --id jqlang.jq
winget install -e --id astral-sh.uv
winget install -e --id Git.Git                          # Git + Git Bash
```

**여기서 PowerShell을 닫고 새로 연다.** 설치한 도구의 `PATH`는 새 터미널부터 적용된다.

```powershell
# pnpm (프론트 package.json의 packageManager와 같은 버전)
npm install -g pnpm@11.18.0

# 확인
node -v; pnpm -v; java -version; jq --version; uv --version; git --version
```

### 2. Claude Code

**macOS**

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version
```

**Windows (PowerShell)**

```powershell
irm https://claude.ai/install.ps1 | iex
claude --version
```

winget으로 받아도 된다(`winget install -e --id Anthropic.ClaudeCode`). 대신 자동 업데이트가 되지 않아
`winget upgrade Anthropic.ClaudeCode`를 직접 돌려야 한다.

Windows에서 Claude Code의 Bash 도구는 Git Bash를 쓴다. 1단계의 Git for Windows를 기본 경로가 아닌 곳에
설치했으면 `~/.claude/settings.json`에 경로를 적는다.

```json
{ "env": { "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe" } }
```

### 3. graft CLI (선택)

**안 써도 된다.** 저장소는 graft 없이도 그대로 동작한다. 쓰지 않으면 이 단계와 6단계의 graft 부분을
건너뛰고 4단계로 간다.

공식 안내는 <https://trailhq.com/graft#start>에 있다. 여기서는 전역 설치만 한다.
그 페이지의 두 번째 명령 `graft init`은 저장소를 클론한 뒤 6단계에서, **플래그를 붙여** 실행한다.
페이지에 적힌 그대로 실행하면 추적 중인 파일과 홈 디렉터리 설정까지 바뀐다.

`graft`를 `PATH`에서 찾는다. `.mcp.json`의 MCP 서버와 `.claude/settings.json`의 훅·상태줄이 여기에 해당한다.
macOS에서 nvm을 쓰면 **1단계에서 설치한 Node 24가 활성화된 셸에서** 전역 설치한다.

```bash
DO_NOT_TRACK=1 npm install -g @nanonets/graft
graft --version
```

Windows PowerShell에서는 환경 변수를 앞에 붙이는 문법이 달라 따로 넣는다.

```powershell
$env:DO_NOT_TRACK = 1
npm install -g @nanonets/graft
graft --version
```

### 4. 저장소 클론과 의존성 설치

**macOS**

```bash
git clone https://github.com/nalpari/hoka.git
cd hoka

(cd hoka-fo-front && pnpm install --frozen-lockfile)
(cd hoka-bo-front && pnpm install --frozen-lockfile)
(cd hoka-fo-api && ./mvnw -q dependency:go-offline)
(cd hoka-bo-api && ./mvnw -q dependency:go-offline)
(cd hoka-batch && ./mvnw -q dependency:go-offline)
```

**Windows (PowerShell)**

```powershell
git clone https://github.com/nalpari/hoka.git
cd hoka

foreach ($d in 'hoka-fo-front','hoka-bo-front') {
  Push-Location $d; pnpm install --frozen-lockfile; Pop-Location
}
foreach ($d in 'hoka-fo-api','hoka-bo-api','hoka-batch') {
  Push-Location $d; .\mvnw.cmd -q dependency:go-offline; Pop-Location
}
```

### 5. 로컬 DB (Docker)

세 프로젝트가 같은 PostgreSQL `appdb`를 쓴다. 이미지 태그는 테스트의 Testcontainers가 쓰는 것과
같은 `postgres:18-alpine`으로 맞춘다. 로컬에 PostgreSQL이 이미 5432를 쓰고 있으면 `-p 5433:5432`처럼
바꾸고 각 프로젝트의 `DB_URL`도 같이 바꾼다.

```bash
docker run -d --name hoka-db \
  -e POSTGRES_DB=appdb \
  -e POSTGRES_USER=app \
  -e POSTGRES_PASSWORD=app \
  -p 5432:5432 \
  -v hoka-db:/var/lib/postgresql \
  postgres:18-alpine
```

Windows PowerShell에서는 줄바꿈 문자가 달라 한 줄로 쓴다.

```powershell
docker run -d --name hoka-db -e POSTGRES_DB=appdb -e POSTGRES_USER=app -e POSTGRES_PASSWORD=app -p 5432:5432 -v hoka-db:/var/lib/postgresql postgres:18-alpine
```

`appdb`, 계정 `app`/`app`은 `hoka-fo-api`와 `hoka-batch`의 기본값이고 `hoka-bo-api`의 `local` 프로파일
값이라, 이대로 두면 세 프로젝트 모두 설정 없이 붙는다.

볼륨은 `/var/lib/postgresql/data`가 아니라 **`/var/lib/postgresql`에 붙인다.** PostgreSQL 18부터 데이터
디렉터리 규칙이 바뀌어서, 예전 글을 보고 `/data`에 마운트하면 컨테이너가 기동하지 않고 바로 죽는다.

**`sample` 테이블만 직접 만든다.** 나머지는 앱이 알아서 만든다 — `hoka-bo-api`의 `bo_*` 테이블은 기동할 때
Flyway가, `hoka-batch`의 `BATCH_*` 테이블은 첫 실행 때 Spring Batch가 만든다. `sample`은 DDL이 저장소에
없고 만드는 코드도 없어서, 이걸 빼면 `hoka-fo-api`의 `SampleControllerTests`가 실패한다.

```bash
docker exec hoka-db psql -U app -d appdb -c "create table sample (id bigserial primary key, name text not null, created_at timestamptz not null default now());"
```

확인과 정리는 이렇게 한다.

```bash
docker exec hoka-db psql -U app -d appdb -c '\dt'   # 테이블 목록
docker stop hoka-db && docker start hoka-db          # 멈췄다 다시 켜기 (데이터 유지)
docker rm -f hoka-db && docker volume rm hoka-db     # 데이터까지 지우고 처음부터
```

테스트가 쓰는 DB는 이 컨테이너가 아니다. `hoka-bo-api`와 `hoka-batch`는 Testcontainers가 매번 빈
PostgreSQL을 따로 띄우므로, 이 컨테이너를 지워도 그 테스트는 영향을 받지 않는다(Docker 자체는 필요하다).

### 6. Claude Code 설정

`.claude/settings.json`은 사람마다 내용이 갈려 git에 없다. 클론한 뒤 각자 만든다.

#### okf 동기화 훅 등록

**graft를 쓰든 안 쓰든 필요하다.** 이 훅이 없으면 코드만 고치고 `okf/` 문서를 빠뜨려도 아무도 알려주지
않는다. 추적되는 [`.claude/settings.json.example`](.claude/settings.json.example)을 복사해서 쓴다.
훅 스크립트 자체도 저장소에 있다.

```bash
cp .claude/settings.json.example .claude/settings.json
```

```powershell
Copy-Item .claude/settings.json.example .claude/settings.json
```

#### graft 설정과 그래프 생성 (선택)

3단계에서 graft를 설치했을 때만 한다. graft가 만드는 파일(`.mcp.json`, `.claude/settings.json`,
`.claude/helpers/`, `.claude/skills/graft/`)도 git에 없다. 헬퍼 스크립트에 그 PC의 graft 설치 경로가
절대 경로로 새겨지기 때문이다. 저장소 루트에서 실행한다.

```bash
graft init --no-agents   # 위 네 경로를 만들고 graft/ 그래프까지 만든다
```

**`--no-agents`를 꼭 붙인다.** 빼면 Claude Code 외의 에이전트 설정까지 써서 `AGENTS.md`(추적 중인
파일이다)를 고치고 `opencode.json`, `.cursor/`, `GEMINI.md`, `.gemini/`, `.grok/`를 만든다. 전부
`.gitignore`에 없어 작업 트리가 더러워진다.

**저장소 밖도 건드린다.** `~/.claude/settings.json`, `~/.claude.json`처럼 **모든 저장소에 영향을 주는**
사용자 설정을 함께 쓴다. `--no-global`이 이걸 막는다고 도움말에 적혀 있지만 graft 0.18.0의 `--dry-run`
출력에는 플래그를 줘도 그대로 남으니, 실제로 막히는지는 기대하지 않는 편이 낫다. 무엇을 건드릴지는
**쓰기 전에** 확인할 수 있다.

```bash
graft init --no-agents --dry-run   # 건드릴 파일만 출력하고 끝낸다
```

그래프는 `graft init`이 같이 만들어 준다(`--no-build`가 그걸 끄는 옵션이다). 따로 다시 만들 일이
있으면 `graft build`를 쓴다. API 키가 필요 없고 비용도 들지 않는다. 이후에는 훅이 편집할 때마다 갱신한다.

**`graft init`은 `.claude/settings.json`을 통째로 새로 쓴다.** 위에서 복사한 okf 훅이 지워지므로,
`graft init` 뒤에 `.claude/settings.json.example`의 `hooks.Stop` 항목을 생성된 파일의 `hooks.Stop`
배열에 다시 더한다. graft도 `Stop` 훅을 넣으므로 배열을 통째로 바꾸지 말고 항목만 추가한다.

### 7. Claude Code 실행

```bash
claude
```

- 프로젝트 스킬 `/hoka-cnp`(커밋·푸시)는 `.claude/skills/`에 들어 있어 따로 설치하지 않는다.
- graft를 설치했으면, 처음 실행할 때 프로젝트 MCP 서버 `graft`(`.mcp.json`)를 허용할지 묻는다. 허용하고
  `/mcp`로 connected인지 확인한다. graft 스킬도 `graft init`이 같이 깔아 준다.

### Windows에서 이 문서의 나머지를 읽는 법

아래 명령은 모두 macOS 기준으로 적혀 있다. Windows에서는 이렇게 바꿔 읽는다.

- **`./mvnw` → `.\mvnw.cmd`** (PowerShell·CMD 기준). Git Bash에서는 `./mvnw` 그대로 쓴다.
- **PowerShell에서는 `-D...` 인자를 따옴표로 감싼다** — `.\mvnw.cmd test "-Dtest=HokaFoApiApplicationTests#contextLoads"`.
  감싸지 않으면 PowerShell이 먼저 해석해 Maven에 그대로 넘어가지 않는다. 특히 `#`은 주석 시작 문자라
  뒤가 잘린 채 **오류 없이** 그 클래스 전체가 돌아간다. CMD와 Git Bash는 따옴표가 필요 없다.
- **`bin/run-job.sh`는 bash 스크립트라 Git Bash에서 실행한다.** 날짜 계산에 GNU `date`를 쓰는데
  Git Bash에 들어 있어서 그대로 동작한다.
- 환경 변수는 `export X=y` 대신 `$env:X = 'y'`(PowerShell)로 넣는다.

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
- **`hoka-bo-front`에 구현된 화면**은 `/login`, `/dashboard`(`/`가 여기로 보낸다), `/menus`, `/roles`, `/users`다.
  대시보드 숫자는 집계 API가 생기기 전까지 `src/app/dashboard/mock.ts`의 가짜 데이터다.
  브라우저는 API를 직접 부르지 않는다 — Next 서버가 토큰을 HttpOnly 쿠키로 들고 Bearer 헤더로 옮겨 붙이고,
  경로 보호는 `src/proxy.ts`에 있다(Next 16에서 `middleware`가 `proxy`로 바뀌었다).
  `hoka-fo-front`는 아직 스캐폴드 그대로다.

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
  - BO는 JWT 리소스 서버다. 로그인·갱신·로그아웃, 초대, `/actuator/health`, Swagger 경로가 공개이고
    나머지는 Bearer 토큰이 필요하다(Swagger는 `local` 밖에서 springdoc이 꺼져 있어 404다).
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
- `hoka-*-front/.env*` (단 `hoka-bo-front/.env.example`은 추적한다)
- `**/.agent/`
- `/graft/`: graft 그래프 캐시. `graft build`로 다시 만든다
- `/.mcp.json`, `/.claude/settings.json`, `/.claude/helpers/`, `/.claude/skills/graft/`:
  `graft init`이 만드는 파일. 헬퍼에 그 PC의 절대 경로가 들어간다.
  단 `.claude/settings.json.example`(okf 동기화 훅)은 추적한다

## Claude Code 사용 시

- 루트 [CLAUDE.md](CLAUDE.md)와 각 프로젝트의 `CLAUDE.md`가 에이전트 지침이다. `AGENTS.md`도 읽힌다 —
프론트 두 개에는 Next.js 블록이, 루트에는 graft 블록이 들어 있다. 둘 다 `<!-- ... -->` 표시로 감싼
자동 생성 구역이라(`next dev`와 `graft init`이 다시 쓴다) 지우지 말고, 손으로 쓸 내용은 그 바깥에 둔다.
- Stop 훅 [`.claude/hooks/okf-sync-check.sh`](.claude/hooks/okf-sync-check.sh)가 응답을 끝내기 전에
프로젝트 파일은 바뀌었는데 `okf/`가 그대로인지 확인한다. 스크립트는 저장소에 있지만 **등록은 각자
`.claude/settings.json`에 해야 한다** — [처음 설치하기](#처음-설치하기-claude-code-기준) 6단계 참고. 동작하려면 `jq`가 필요하다.
- graft는 선택이다. 설치했으면 훅(`.claude/helpers/graft-hooks.cjs`)이 세션 시작, 프롬프트 제출, 편집 후에
그래프를 갱신하고 컨텍스트를 붙인다. 이 파일도 git에 없어 `graft init`이 만든다.
훅이 조용하면 [처음 설치하기](#처음-설치하기-claude-code-기준) 3·6단계를 확인한다.
- 워크트리는 명시적으로 요청할 때만 만든다. 위치는 macOS/Linux가 `~/.worktrees/hoka/<관광명소>`,
Windows가 `C:\workspace\.worktrees\hoka\<관광명소>`이고, 브랜치 이름은 포켓몬으로 짓는다.
절차는 [`okf/development/worktrees.md`](okf/development/worktrees.md)를 따른다.

