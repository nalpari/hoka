# hoka-batch

셸에서 `java -jar`로 job을 골라 실행하는 Spring Batch jar입니다. 웹 서버는 뜨지 않고, job 하나를 실행한 뒤 종료 코드를 남기고 끝납니다.

- Spring Boot 4.1.1, Spring Batch 6, Java 21, Maven Wrapper
- 데이터 접근: MyBatis + PostgreSQL (`appdb`)
- 운영 규칙과 배경 설명: [`okf/projects/hoka-batch.md`](../okf/projects/hoka-batch.md)

## 준비물

| 항목 | 용도 |
|---|---|
| JDK 21 | 빌드와 실행 |
| PostgreSQL | job 실행. 기본 접속 정보는 `localhost:5432/appdb`, `app`/`app` |
| Docker | `./mvnw test` 실행 (Testcontainers가 PostgreSQL 컨테이너를 띄움) |

DB 접속 정보는 환경변수로 바꿉니다.

```bash
export DB_URL=jdbc:postgresql://db-host:5432/appdb
export DB_USERNAME=app
export DB_PASSWORD=secret
```

## 빌드

모든 명령은 `hoka-batch/` 디렉터리에서 실행합니다.

```bash
./mvnw test        # 테스트 (Docker 필요)
./mvnw package     # 테스트 후 target/hoka-batch.jar 생성
./mvnw package -DskipTests   # 테스트 없이 jar만 생성
```

테스트 하나만 돌리려면 다음과 같이 실행합니다.

```bash
./mvnw test -Dtest=SampleJobTests#countsSampleRowsWithinKstDay
```

## 실행

### 스크립트로 실행 (권장)

```bash
bin/run-job.sh <jobName> [targetDate]
```

```bash
bin/run-job.sh sampleJob 2026-09-14   # 2026-09-14 하루치 처리
bin/run-job.sh sampleJob              # Asia/Seoul 기준 어제 날짜로 처리
```

- `targetDate` 형식은 `yyyy-MM-dd`입니다.
- 날짜를 생략했을 때 어제를 계산하려면 GNU `date`가 필요합니다. **macOS에서는 날짜를 직접 넘기세요.**
- 기본 jar 경로는 `target/hoka-batch.jar`입니다. 다른 위치의 jar를 쓰려면 `HOKA_BATCH_JAR`를 지정합니다.

```bash
HOKA_BATCH_JAR=/opt/hoka-batch/hoka-batch.jar bin/run-job.sh sampleJob 2026-09-14
```

### jar 직접 실행

스크립트가 내부에서 실행하는 명령과 같습니다.

```bash
java -jar target/hoka-batch.jar --spring.batch.job.name=sampleJob targetDate=2026-09-14
```

- `--spring.batch.job.name`으로 실행할 job을 고릅니다. job이 둘 이상인데 이 값을 빼면 기동이 실패합니다.
- `이름=값` 형태의 인자는 job 파라미터가 됩니다. `targetDate`는 필수이며 기본값이 없습니다.

### 등록된 job

| job | 설명 |
|---|---|
| `sampleJob` | `targetDate` 하루(Asia/Seoul) 동안 생성된 `sample` 행 수를 세어 로그로 남깁니다. 읽기 전용입니다. |

## 재실행 규칙

job 이름과 `targetDate`가 같으면 같은 실행 단위로 취급합니다.

| 같은 날짜의 이전 실행 상태 | 다시 실행하면 |
|---|---|
| 성공 | 거부 (`JobInstanceAlreadyCompleteException`) |
| 실패 | 실패한 step부터 이어서 실행 |
| 실행 중으로 남아 있음 | 거부 (`JobExecutionAlreadyRunningException`) |

## 종료 코드

| 코드 | 의미 |
|---|---|
| 0 | 성공 |
| 1 | job 실패, 파라미터 오류, 재실행 거부, 복구할 실행 없음 |
| 2 | `run-job.sh` 인자 개수 오류 |

## 비정상 종료 복구

`kill -9`, 재부팅, OOM 등으로 프로세스가 죽으면 실행이 "실행 중" 상태로 남습니다. 이 상태에서는 같은 날짜로 다시 실행할 수 없습니다.

1. 해당 프로세스가 **정말 종료됐는지 먼저 확인합니다.** 살아 있는 실행을 복구하면 두 프로세스가 같은 날짜를 동시에 처리합니다.
2. 남아 있는 실행을 FAILED로 표시합니다.
   ```bash
   bin/run-job.sh --recover sampleJob 2026-09-14
   ```
3. 같은 날짜로 다시 실행합니다. 실패한 step부터 이어서 실행됩니다.
   ```bash
   bin/run-job.sh sampleJob 2026-09-14
   ```

## cron 등록 예시

로그는 stdout으로만 출력되므로 파일에 남기려면 리다이렉트합니다.

```cron
10 2 * * * HOKA_BATCH_JAR=/opt/hoka-batch/hoka-batch.jar /opt/hoka-batch/bin/run-job.sh sampleJob >> /var/log/hoka-batch/sampleJob.log 2>&1
```

## 메타 테이블

Spring Batch 메타 테이블(`BATCH_*`)은 `appdb`의 `public` 스키마에 있습니다.

- 로컬: 기동할 때 자동으로 생성합니다 (`initialize-schema: always`).
- 운영: `SPRING_BATCH_JDBC_INITIALIZE_SCHEMA=never`로 자동 생성을 끄고, `spring-batch-core` jar 안의 `org/springframework/batch/core/schema-postgresql.sql`을 직접 적용합니다.
