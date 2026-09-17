# hoka-bo-api

백오피스(관리자용) REST API 서버입니다. 패키지는 `com.hoka.bo`입니다.

- Spring Boot 4.1.1, Java 21, Maven Wrapper
- Spring Web MVC, Spring Security(JWT 리소스 서버), Actuator, Flyway, MyBatis + PostgreSQL (`appdb`), springdoc
- 프로젝트 설명: [`okf/projects/hoka-bo-api.md`](../okf/projects/hoka-bo-api.md)
- 인증·권한 계약: [`okf/architecture/bo-auth.md`](../okf/architecture/bo-auth.md)

## 준비물

| 항목 | 용도 |
|---|---|
| JDK 21 | 빌드와 실행 |
| PostgreSQL | 실행. `local` 프로파일 기본값은 `localhost:5432/appdb`, `app`/`app` |
| Docker | 테스트. Testcontainers가 PostgreSQL을 직접 띄웁니다 |

## 설정

`application.yaml`에는 **기본값 없는** 환경변수만 있습니다. 채워지지 않으면 기동하지 않습니다.

| 환경변수 | 용도 |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | DB 접속 |
| `BO_JWT_SECRET` | 액세스 토큰 서명 키 (32바이트 이상) |
| `BO_ADMIN_EMAIL`, `BO_ADMIN_PASSWORD` | 기동할 때 만드는 첫 슈퍼관리자 계정 |
| `BO_FRONT_BASE_URL` | 초대 메일에 넣을 백오피스 프론트 주소 |

로컬 값은 `application-local.yaml`에 있으므로 **`local` 프로파일로 띄우면 환경변수를 따로 넣지 않아도 됩니다.**
다른 환경은 이 파일 없이 위 환경변수로 같은 키를 채웁니다.

스키마는 Flyway가 관리합니다(`src/main/resources/db/migration`, 이력 테이블 `bo_flyway_schema_history`).
기동할 때 마이그레이션이 적용되고, `V2`가 역할 7개와 메뉴 트리를 넣습니다.

## 실행

모든 명령은 `hoka-bo-api/` 디렉터리에서 실행합니다.

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # 소스에서 바로 실행
java -jar target/bo-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

**Windows PowerShell에서는 `-D...` 인자를 따옴표로 감쌉니다.** 감싸지 않으면 PowerShell이 인자를 자기 문법으로
먼저 해석해 Maven에 그대로 전달되지 않습니다. 이 문서의 다른 `-D...` 명령도 모두 같습니다.

```powershell
./mvnw spring-boot:run "-Dspring-boot.run.profiles=local"
```

CMD와 Git Bash에서는 따옴표 없이 그대로 씁니다.

**프로파일을 빼면 환경변수가 없어 기동에 실패합니다.** 프로파일 없이 띄우려면 위 환경변수를 모두 export 합니다.

기본 포트는 `8080`입니다. hoka-fo-api도 기본 포트가 `8080`이라 둘을 함께 띄우면 충돌합니다.
이때는 이 API를 `8081`로 띄우고, 호출 예시의 포트도 `8081`로 바꿉니다.

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.arguments=--server.port=8081
java -jar target/bo-0.0.1-SNAPSHOT.jar --spring.profiles.active=local --server.port=8081
```

PowerShell에서는 `-D...` 두 개를 각각 감쌉니다.

```powershell
./mvnw spring-boot:run "-Dspring-boot.run.profiles=local" "-Dspring-boot.run.arguments=--server.port=8081"
```

`local`에서는 Swagger UI가 <http://localhost:8080/swagger-ui.html>에 열립니다(다른 환경에서는 꺼져 있습니다).

## 빌드

```bash
./mvnw test                  # Testcontainers로 PostgreSQL을 띄우므로 Docker가 떠 있어야 합니다
./mvnw package               # 테스트 후 target/bo-0.0.1-SNAPSHOT.jar 생성
./mvnw package -DskipTests   # 테스트 없이 jar만 생성
```

테스트 하나만 돌리려면 다음과 같이 실행합니다.

```bash
./mvnw test -Dtest=HokaBoApiApplicationTests#contextLoads
```

PowerShell에서는 따옴표가 특히 중요합니다. `#`이 주석 시작 문자라, 감싸지 않으면 `#contextLoads`가
잘린 채 전달되어 **오류 없이 그 클래스의 테스트 전체가 돌아갑니다.**

```powershell
./mvnw test "-Dtest=HokaBoApiApplicationTests#contextLoads"
```

## 호출

### 인증

JWT 리소스 서버입니다. 로그인·갱신·로그아웃(`/api/auth/login`, `/refresh`, `/logout`), 초대(`/api/invitations/**`),
`/actuator/health`만 공개이고 나머지는 `Authorization: Bearer <accessToken>` 헤더가 필요합니다.
메뉴별 등록·조회·수정·삭제 권한은 Service 메서드의 `@PreAuthorize`에서 확인합니다.

첫 슈퍼관리자는 기동할 때 만들어집니다(`local` 기본값은 `admin@hoka.co.kr` / `admin1234!`).

```bash
# 로그인 — accessToken, refreshToken, expiresInSeconds를 돌려줍니다
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "admin@hoka.co.kr", "password": "admin1234!", "rememberMe": false}'

# 받은 토큰으로 호출
TOKEN=<accessToken>
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/menus
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/users
```

브라우저는 이 API를 직접 부르지 않습니다. hoka-bo-front의 Next 서버(BFF)가 토큰을 HttpOnly 쿠키로 들고
Bearer 헤더로 옮겨 붙입니다. 전체 흐름은 [`okf/architecture/bo-auth.md`](../okf/architecture/bo-auth.md)에 있습니다.

### 엔드포인트

| 경로 | 내용 |
|---|---|
| `/api/auth/**` | 로그인, 토큰 갱신, 로그아웃, 내 정보, 비밀번호 변경 |
| `/api/invitations/{token}`, `/{token}/accept` | 초대 확인과 수락 (공개) |
| `/api/users/**` | 사용자 목록·상세·초대·잠금 해제·비밀번호 초기화·역할 변경 |
| `/api/roles/**` | 역할 CRUD와 메뉴 권한 저장 |
| `/api/menus` | 메뉴 트리 |

에러 응답은 RFC 9457 ProblemDetail 형식입니다.
