# HOKA

프론트오피스(고객용)와 백오피스(관리자용)가 각각 Next.js 프론트와 Spring Boot API 한 쌍으로 이뤄지고,
셸에서 실행하는 Spring Batch jar가 하나 붙은 모노레포다. 백오피스는 로그인과 사용자·역할·메뉴 관리가 동작하고,
프론트오피스는 아직 스캐폴딩 직후 상태다.

## 처음 설치하기 (Claude Code 기준)

위에서부터 순서대로 실행한다. 각 단계에서 **자기 OS 블록만** 실행하고, 이미 설치된 도구는 건너뛴다.
**3단계(graft CLI)와 6단계는 선택이다.** 건너뛰어도 빌드·테스트·실행은 전부 정상이고,
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

프로젝트마다 CodeCommit 저장소가 따로 있다. 다섯 개를 같은 상위 디렉터리에 나란히 클론한다.
`<session 명>`은 CodeCommit 자격 증명 헬퍼가 쓸 AWS 프로파일(세션) 이름으로 바꾼다.

**macOS**

```bash
git clone codecommit://<session 명>@hoka-dev-bo.git       # 백오피스 UI
git clone codecommit://<session 명>@hoka-dev-bo-api.git   # 백오피스 API
git clone codecommit://<session 명>@hoka-dev-fo.git       # 프론트오피스 UI
git clone codecommit://<session 명>@hoka-dev-fo-api.git   # 프론트오피스 API
git clone codecommit://<session 명>@hoka-dev-batch.git    # 배치

(cd hoka-dev-bo && pnpm install --frozen-lockfile)
(cd hoka-dev-fo && pnpm install --frozen-lockfile)
(cd hoka-dev-bo-api && ./mvnw -q dependency:go-offline)
(cd hoka-dev-fo-api && ./mvnw -q dependency:go-offline)
(cd hoka-dev-batch && ./mvnw -q dependency:go-offline)
```

**Windows (PowerShell)**

```powershell
foreach ($r in 'hoka-dev-bo','hoka-dev-bo-api','hoka-dev-fo','hoka-dev-fo-api','hoka-dev-batch') {
  git clone "codecommit://<session 명>@$r.git"
}
foreach ($d in 'hoka-dev-bo','hoka-dev-fo') {
  Push-Location $d; pnpm install --frozen-lockfile; Pop-Location
}
foreach ($d in 'hoka-dev-bo-api','hoka-dev-fo-api','hoka-dev-batch') {
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

### 6. graft 설정과 그래프 생성 (선택)

3단계에서 graft를 설치했을 때만 한다. graft가 만드는 파일(`.mcp.json`, `.claude/settings.json`,
`.claude/helpers/`, `.claude/skills/graft/`)은 git에 없다. 헬퍼 스크립트에 그 PC의 graft 설치 경로가
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

**`graft init`은 `.claude/settings.json`을 통째로 새로 쓴다.** okf 동기화 훅을 등록해 뒀다면 지워지므로,
`graft init` 뒤에 `.claude/settings.json.example`의 `hooks.Stop` 항목을 생성된 파일의 `hooks.Stop`
배열에 다시 더한다. graft도 `Stop` 훅을 넣으므로 배열을 통째로 바꾸지 말고 항목만 추가한다.

### 7. Claude Code 실행

```bash
claude
```

- 프로젝트 스킬 `/hoka-cnp`(커밋·푸시)는 `.claude/skills/`에 들어 있어 따로 설치하지 않는다.
- graft를 설치했으면, 처음 실행할 때 프로젝트 MCP 서버 `graft`(`.mcp.json`)를 허용할지 묻는다. 허용하고
  `/mcp`로 connected인지 확인한다. graft 스킬도 `graft init`이 같이 깔아 준다.

### Windows에서 README의 나머지를 읽는 법

[README](README.md)의 실행·빌드·테스트 명령은 모두 macOS 기준으로 적혀 있다. Windows에서는 이렇게 바꿔 읽는다.

- **`./mvnw` → `.\mvnw.cmd`** (PowerShell·CMD 기준). Git Bash에서는 `./mvnw` 그대로 쓴다.
- **PowerShell에서는 `-D...` 인자를 따옴표로 감싼다** — `.\mvnw.cmd test "-Dtest=HokaFoApiApplicationTests#contextLoads"`.
  감싸지 않으면 PowerShell이 먼저 해석해 Maven에 그대로 넘어가지 않는다. 특히 `#`은 주석 시작 문자라
  뒤가 잘린 채 **오류 없이** 그 클래스 전체가 돌아간다. CMD와 Git Bash는 따옴표가 필요 없다.
- **`bin/run-job.sh`는 bash 스크립트라 Git Bash에서 실행한다.** 날짜 계산에 GNU `date`를 쓰는데
  Git Bash에 들어 있어서 그대로 동작한다.
- 환경 변수는 `export X=y` 대신 `$env:X = 'y'`(PowerShell)로 넣는다.

