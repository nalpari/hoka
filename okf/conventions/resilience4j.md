---
type: Convention
title: Resilience4j
description: API에서 DB·외부 호출 장애를 Resilience4j Retry와 CircuitBreaker로 다루는 규칙. 현재 hoka-fo-api에만 적용.
tags: [api, fo, resilience4j, convention]
status: draft
generated: { by: claude-code/claude-opus-5, at: 2026-09-15T05:25:00Z }
sources:
  - id: pom
    resource: ../../hoka-fo-api/pom.xml
    title: pom.xml (FO)
  - id: app-yaml
    resource: ../../hoka-fo-api/src/main/resources/application.yaml
    title: application.yaml (FO)
  - id: controller
    resource: ../../hoka-fo-api/src/main/java/com/hoka/fo/sample/SampleController.java
    title: SampleController.java (FO)
  - id: tests
    resource: ../../hoka-fo-api/src/test/java/com/hoka/fo/sample/SampleResilienceTests.java
    title: SampleResilienceTests.java (FO)
  - id: r4j-release
    resource: https://github.com/resilience4j/resilience4j/releases/tag/v2.4.0
    title: Resilience4j v2.4.0 release (Spring Boot 4 지원)
  - id: mybatis-translator
    resource: https://github.com/mybatis/spring/blob/master/src/main/java/org/mybatis/spring/MyBatisExceptionTranslator.java
    title: MyBatisExceptionTranslator.java
---

# Scope

- 적용 프로젝트는 [hoka-fo-api](/projects/hoka-fo-api.md)뿐이다. [hoka-bo-api](/projects/hoka-bo-api.md)에는 의존성이 없다. BO에 넣으면 이 문서의 범위도 고친다.
- 대상은 일시적으로 실패할 수 있는 호출이다: DB, 앞으로 생길 외부 HTTP 호출. 입력 검증 실패(400)와 없는 리소스(404)는 대상이 아니다.
- 현재 적용 지점은 시연용 `GET /api/samples/{id}` 한 곳이다([Sample CRUD](/architecture/sample-crud.md)).[^controller]

# Dependencies

| 의존성 | 이유 |
|---|---|
| `io.github.resilience4j:resilience4j-spring-boot4` 2.4.0 | Spring Boot 4 지원 모듈.[^r4j-release] Boot가 버전을 관리하지 않아 `pom.xml`에 버전을 적는다[^pom] |
| `spring-boot-starter-aspectj` | `@Retry`·`@CircuitBreaker` 어노테이션이 AOP로 동작한다. resilience4j 모듈이 포함하지 않으므로 빠지면 어노테이션이 조용히 무시된다 |

Spring Framework 7에 내장된 `@Retryable`·`@ConcurrencyLimit`는 쓰지 않는다. 재시도 방식을 두 가지로 섞지 않기 위해서다.

# Instances

- 설정은 `application.yaml`의 `resilience4j.<패턴>.instances.<이름>`에 둔다. 어노테이션의 `name`과 인스턴스 이름을 같게 한다.[^app-yaml]
- 이름은 보호하는 대상(도메인·외부 시스템) 기준 kebab-case로 짓는다. 현재 `sample` 하나.
- yaml에 없는 이름도 기본값으로 동작해서 오타가 드러나지 않는다(예: `minimum-number-of-calls` 기본값 100이라 브레이커가 사실상 열리지 않음). 새 이름은 반드시 인스턴스 설정을 같이 추가한다.

현재 `sample` 설정:

| 패턴 | 키 | 값 |
|---|---|---|
| Retry | `max-attempts` / `wait-duration` | 3 / 200ms |
| Retry | `retry-exceptions` | `org.springframework.dao.DataAccessException` |
| CircuitBreaker | `sliding-window-size` / `minimum-number-of-calls` | 10 / 10 |
| CircuitBreaker | `failure-rate-threshold` / `wait-duration-in-open-state` | 50 / 10s |
| CircuitBreaker | `record-exceptions` | `org.springframework.dao.DataAccessException` |
| CircuitBreaker | `register-health-indicator` / `allow-health-indicator-to-fail` | true / false |

# Annotations

- 적용 순서는 Retry가 바깥(aspect order `LOWEST_PRECEDENCE - 5`), CircuitBreaker가 안쪽(`LOWEST_PRECEDENCE - 4`)이다. 재시도 한 번 한 번이 브레이커에 실패로 기록되므로 요청 1번이 최대 3번 기록된다.
- `fallbackMethod`는 가장 바깥인 `@Retry`에만 단다. 안쪽 `@CircuitBreaker`에 달면 fallback이 던진 예외를 Retry가 다시 재시도한다.[^controller]
- fallback은 처리할 예외 타입별로 오버로드한다(`DataAccessException`, `CallNotPermittedException`). `Throwable`로 받으면 코드 버그까지 503으로 가려진다. 타입이 맞는 fallback이 없으면 원래 예외가 그대로 나간다.
- 어노테이션은 스프링 빈의 public 메서드에 붙인다. 같은 클래스 안에서 호출하면 프록시를 거치지 않아 적용되지 않는다.
- 서비스 계층이 없으므로 지금은 컨트롤러 메서드에 붙인다.

# Exceptions

- Retry의 `retry-exceptions`와 CircuitBreaker의 `record-exceptions`는 둘 다 `DataAccessException`이다. 목록에 없는 예외(예: 400을 뜻하는 `ResponseStatusException`)는 재시도하지 않고 실패로 세지도 않는다.
- 상위 타입을 쓰는 이유: MyBatis를 거친 DB 장애는 원인에 따라 다른 하위 예외로 올라온다. 원인이 `SQLException`이면 Spring 변환기가 분류한 예외(타임아웃이면 transient)가 되고, 아니면 `MyBatisSystemException`(non-transient)이 된다.[^mybatis-translator] DB 연결 실패인 `CannotGetJdbcConnectionException`도 non-transient 계층이라, `TransientDataAccessException`만 지정하면 DB가 내려갔을 때 재시도하지 않는다.
- 부작용: SQL 문법 오류 같은 코드 버그도 3번 재시도되고 브레이커를 열 수 있다.

# Response

재시도를 다 쓰거나 브레이커가 열려 있으면 503 `ResponseStatusException`으로 응답한다. 가짜 데이터로 대체하지 않는다.[^controller]

# Actuator

- `/actuator/health`의 `components.circuitBreakers.details.<이름>`에 브레이커 상태(`state`, `failureRate` 등)가 나온다(`management.endpoint.health.show-details: when-authorized`).[^app-yaml] `SecurityConfig`가 모든 요청에 인증을 요구하므로 Basic 인증 없이 호출하면 health 요약도 없이 401이다.
- 켜려면 `management.health.circuitbreakers.enabled: true`와 인스턴스의 `register-health-indicator: true`가 둘 다 필요하다.
- `allow-health-indicator-to-fail: false`라 브레이커가 OPEN이어도 앱 전체 health는 DOWN이 되지 않는다.
- `/actuator/circuitbreakers` 같은 전용 endpoint는 노출하지 않는다.

# Testing

- `SampleResilienceTests`는 `@MockitoBean`으로 매퍼가 `DataAccessResourceFailureException`을 던지게 해서 DB 없이 검증한다.[^tests]
- 브레이커 상태는 같은 스프링 컨텍스트 안에서 공유되므로 `@BeforeEach`에서 `CircuitBreakerRegistry.circuitBreaker(이름).reset()`을 호출한다.
- 확인하는 것: 요청 1번에 매퍼 3번 호출 후 503. 요청 4번(실패 10번) 뒤 OPEN, 이후 매퍼 호출 없이 503.
- 재시도 대기(200ms)만큼 테스트 시간이 늘어난다.

# 새 호출을 보호할 때

1. `application.yaml`에 `retry`·`circuitbreaker` 인스턴스를 추가한다.
2. 메서드에 `@Retry(name, fallbackMethod)`와 `@CircuitBreaker(name)`을 붙인다.
3. 처리할 예외 타입별 fallback을 만든다. 외부 HTTP 호출이면 그 클라이언트의 예외를 `retry-exceptions`·`record-exceptions`에 넣는다.
4. 장애를 흉내 내는 테스트를 추가한다.
5. 이 문서의 적용 지점과 해당 API 계약 문서를 고친다.

[^pom]: pom.xml (FO)
[^app-yaml]: application.yaml (FO)
[^controller]: SampleController.java (FO)
[^tests]: SampleResilienceTests.java (FO)
[^r4j-release]: Resilience4j v2.4.0 release (Spring Boot 4 지원)
[^mybatis-translator]: MyBatisExceptionTranslator.java
