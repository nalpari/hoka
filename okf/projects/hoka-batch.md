---
type: Project
title: hoka-batch
description: 셸에서 java -jar로 job을 골라 실행하는 Spring Batch 6 jar (패키지 com.hoka.batch).
resource: ../../hoka-batch/
tags: [backend, batch, spring-boot, spring-batch, java]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T01:22:11Z }
sources:
  - id: pom
    resource: ../../hoka-batch/pom.xml
    title: pom.xml
  - id: app-yaml
    resource: ../../hoka-batch/src/main/resources/application.yaml
    title: application.yaml
  - id: run-job
    resource: ../../hoka-batch/bin/run-job.sh
    title: run-job.sh
  - id: recover
    resource: ../../hoka-batch/src/main/java/com/hoka/batch/RecoverRunner.java
    title: RecoverRunner.java
  - id: sample-job
    resource: ../../hoka-batch/src/main/java/com/hoka/batch/sample/SampleJobConfig.java
    title: SampleJobConfig.java
  - id: tests
    resource: ../../hoka-batch/src/test/java/com/hoka/batch/SampleJobTests.java
    title: SampleJobTests.java
---

# Stack

| 항목 | 값 |
|---|---|
| Framework | Spring Boot 4.1.1 (Spring Batch 6.0.5), Java 21, Maven Wrapper[^pom] |
| Starters | `spring-boot-starter-batch-jdbc`, `mybatis-spring-boot-starter` 4.1.0. 웹 starter가 없어 웹 서버가 뜨지 않는다[^pom] |
| DB driver | PostgreSQL (runtime) |
| Config | `application.yaml` — `spring.datasource`(API와 같은 환경변수), `spring.batch.jdbc.initialize-schema: always`, `mybatis`[^app-yaml] |
| Test | `spring-boot-starter-batch-jdbc-test`, Testcontainers(`postgres:18-alpine`). **Docker가 떠 있어야 한다**[^tests] |
| Artifact | `target/hoka-batch.jar` (`<finalName>`으로 이름 고정)[^pom] |
| Git | 루트 `hoka/` 저장소에 포함 (자체 `.git` 없음) |

# Commands

```bash
./mvnw test                                                   # Docker 필요
./mvnw test -Dtest=SampleJobTests#countsSampleRowsWithinKstDay
./mvnw package                                                # target/hoka-batch.jar

bin/run-job.sh sampleJob 2026-09-14            # targetDate 생략 시 Asia/Seoul 기준 어제 (GNU date 필요)
bin/run-job.sh --recover sampleJob 2026-09-14  # 멈춘 실행 복구 (아래 # 운영)

# 스크립트 없이 직접 실행
java -jar target/hoka-batch.jar --spring.batch.job.name=sampleJob targetDate=2026-09-14
```

# Job 실행 규칙

- job 여러 개를 jar 하나에 두고 `--spring.batch.job.name`으로 고른다. job이 둘 이상인데 이름을 주지 않으면 기동이 실패한다.
- `이름=값` 형태의 인자는 job 파라미터가 된다. job은 `targetDate`(yyyy-MM-dd)를 **필수 식별 파라미터**로 받고 Java 쪽 기본값은 없다. 새 job도 validator로 강제한다. "어제" 계산은 `run-job.sh`가 한다.[^sample-job][^run-job]
- job 이름 + `targetDate`가 JobInstance 하나다. 따라서 같은 날짜를 다시 실행하면:
  - 이미 성공 → `JobInstanceAlreadyCompleteException`으로 거부
  - FAILED로 끝남 → 실패한 step부터 재시작
  - 실행 중 상태가 남아 있음 → `JobExecutionAlreadyRunningException`으로 거부
- 종료 코드: 성공 0, job 실패·파라미터 오류·재실행 거부·복구 대상 없음 1, `run-job.sh` 인자 오류 2. main이 `System.exit(SpringApplication.exit(...))`로 job 결과를 넘긴다.
- 날짜 경계는 `Asia/Seoul`이다. `created_at` 같은 `timestamptz` 컬럼을 하루 단위로 자를 때 UTC로 자르지 않는다.

# 운영

- 리눅스 cron이 `bin/run-job.sh`를 호출한다. 로그는 stdout으로만 나오므로 파일 저장은 cron 줄의 리다이렉트로 한다. jar 위치는 `HOKA_BATCH_JAR`로 바꾼다(기본 `../target/hoka-batch.jar`).[^run-job]
  ```cron
  # 예시 (경로는 배포 구성에 맞춘다)
  10 2 * * * HOKA_BATCH_JAR=/opt/hoka-batch/hoka-batch.jar /opt/hoka-batch/bin/run-job.sh sampleJob >> /var/log/hoka-batch/sampleJob.log 2>&1
  ```
- 메타 테이블(`BATCH_*` 테이블 6개와 시퀀스)은 `appdb`의 `public` 스키마에 업무 테이블과 함께 둔다. 로컬은 `initialize-schema: always`로 자동 생성하고, 운영은 `SPRING_BATCH_JDBC_INITIALIZE_SCHEMA=never`로 끈 뒤 `spring-batch-core` jar 안의 `org/springframework/batch/core/schema-postgresql.sql`을 직접 적용한다.[^app-yaml]
- **비정상 종료 복구** — `kill -9`, 재부팅, OOM으로 프로세스가 죽으면 실행이 `STARTED`로 남아 같은 날짜가 계속 거부된다.
  1. 그 프로세스가 정말 죽었는지 확인한다. 살아 있는 실행을 복구하면 같은 날짜를 두 프로세스가 처리한다.
  2. `bin/run-job.sh --recover <jobName> <targetDate>` — `JobOperator.recover`로 실행과 step을 FAILED로 표시한다. 실행 중 상태인 실행이 없으면 종료 코드 1로 끝난다.[^recover]
  3. `bin/run-job.sh <jobName> <targetDate>` — 실패한 step부터 다시 실행한다.

# Notes

- `sampleJob`은 파이프라인 확인용 읽기 전용 job이다. `targetDate` 하루 동안의 `sample` 건수를 MyBatis로 세어 로그와 step ExecutionContext의 `count`에 남긴다.[^sample-job] `sample` 테이블 구조와 행을 만드는 API는 [Sample CRUD](/architecture/sample-crud.md)에 있다.
- MyBatis 설정(매퍼 XML `classpath:mapper/**/*.xml`, camelCase 매핑)과 DB 환경변수(`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, 기본 `localhost:5432/appdb`, `app`/`app`)는 [hoka-fo-api](/projects/hoka-fo-api.md)와 같다.
- 테스트는 job 자동 실행을 끈다(`spring.batch.job.enabled=false`). 켜 두면 컨텍스트가 뜰 때 `targetDate` 없이 job이 실행돼 실패한다. `sample` 테이블 DDL은 저장소에 없어서 테스트용으로 `src/test/resources/schema.sql`에 따로 둔다.[^tests]
- `run-job.sh`의 기본 날짜 계산은 GNU `date -d`라 macOS에서는 날짜를 직접 넘겨야 한다.
- 다른 프로젝트를 호출하지 않고 DB만 읽고 쓴다.

[^pom]: pom.xml
[^app-yaml]: application.yaml
[^run-job]: run-job.sh
[^recover]: RecoverRunner.java
[^sample-job]: SampleJobConfig.java
[^tests]: SampleJobTests.java
