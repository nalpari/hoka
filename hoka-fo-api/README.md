# hoka-fo-api

프론트오피스(고객용) REST API 서버입니다. 패키지는 `com.hoka.fo`입니다.

- Spring Boot 4.1.1, Java 21, Maven Wrapper
- Spring Web MVC, Spring Security(HTTP Basic), Actuator, MyBatis + PostgreSQL (`appdb`)
- 프로젝트 설명: [`okf/projects/hoka-fo-api.md`](../okf/projects/hoka-fo-api.md)

## 준비물

| 항목 | 용도 |
|---|---|
| JDK 21 | 빌드와 실행 |
| PostgreSQL | 실행과 테스트. 기본 접속 정보는 `localhost:5432/appdb`, `app`/`app` |

DB 접속 정보는 환경변수로 바꿉니다.

```bash
export DB_URL=jdbc:postgresql://db-host:5432/appdb
export DB_USERNAME=app
export DB_PASSWORD=secret
```

## 빌드

모든 명령은 `hoka-fo-api/` 디렉터리에서 실행합니다.

```bash
./mvnw test                  # 테스트
./mvnw package               # 테스트 후 target/fo-0.0.1-SNAPSHOT.jar 생성
./mvnw package -DskipTests   # 테스트 없이 jar만 생성
```

`SampleControllerTests`는 로컬 `appdb`에 실제로 접속합니다. **DB가 떠 있지 않으면 `test`와 `package`가 실패합니다.**

테스트 하나만 돌리려면 다음과 같이 실행합니다.

```bash
./mvnw test -Dtest=HokaFoApiApplicationTests#contextLoads
```

## 실행

```bash
./mvnw spring-boot:run                    # 소스에서 바로 실행
java -jar target/fo-0.0.1-SNAPSHOT.jar    # 빌드한 jar로 실행
```

기본 포트는 `8080`입니다. hoka-bo-api도 기본 포트가 `8080`이라 둘을 함께 띄우면 충돌합니다. 이때는 hoka-bo-api를 `8081`로 띄웁니다([hoka-bo-api README](../hoka-bo-api/README.md#실행)).

## 호출

### 인증

모든 요청에 HTTP Basic 인증이 필요합니다. 사용자 이름은 `user`이고, 비밀번호는 기동할 때마다 새로 생성되어 로그에 출력됩니다.

```
Using generated security password: 3f2a9c1e-...
```

로컬에서 비밀번호를 고정하려면 환경변수로 지정해 기동합니다.

```bash
SPRING_SECURITY_USER_PASSWORD=local ./mvnw spring-boot:run
```

### Sample API 예시

아래 예시는 비밀번호를 `local`로 고정했다고 가정합니다. 엔드포인트와 응답 코드 전체는 [Sample CRUD](../okf/architecture/sample-crud.md)에 있습니다.

```bash
# 목록 조회
curl -u user:local http://localhost:8080/api/samples

# 단건 조회
curl -u user:local http://localhost:8080/api/samples/1

# 생성
curl -u user:local -X POST http://localhost:8080/api/samples \
  -H 'Content-Type: application/json' \
  -d '{"name": "첫 샘플"}'

# 수정
curl -u user:local -X PUT http://localhost:8080/api/samples/1 \
  -H 'Content-Type: application/json' \
  -d '{"name": "바꾼 이름"}'

# 삭제
curl -u user:local -X DELETE http://localhost:8080/api/samples/1
```

응답 행은 다음 형태입니다.

```json
{"id": 1, "name": "첫 샘플", "createdAt": "2026-09-15T01:23:19.837567Z"}
```
