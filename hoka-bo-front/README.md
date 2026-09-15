# hoka-bo-front

백오피스(관리자용) 웹 앱입니다.

- Next.js 16.3 (App Router, `src/app`), React 19.2, Tailwind CSS v4, TypeScript
- React Compiler 활성 (`next.config.ts`의 `reactCompiler: true`)
- 프로젝트 설명: [`okf/projects/hoka-bo-front.md`](../okf/projects/hoka-bo-front.md)

## 준비물

| 항목 | 용도 |
|---|---|
| Node.js 20.9 이상 | Next.js 16 실행 |
| pnpm 11.18.0 | 패키지 관리 (`package.json`의 `packageManager`) |

pnpm이 없으면 Corepack으로 `package.json`에 지정된 버전을 켭니다.

```bash
corepack enable
```

**`npm install`은 쓰지 않습니다.** `package-lock.json`이 새로 생겨 pnpm 잠금 파일과 어긋납니다.

## 설치

모든 명령은 `hoka-bo-front/` 디렉터리에서 실행합니다.

```bash
pnpm install --frozen-lockfile
```

pnpm은 의존성의 빌드 스크립트를 기본으로 막습니다. 설치 중 `ERR_PNPM_IGNORED_BUILDS`가 나면 `pnpm-workspace.yaml`의 `allowBuilds`에 해당 패키지를 `true`(허용) 또는 `false`(차단)로 추가합니다.

## 실행

```bash
pnpm dev     # 개발 서버, http://localhost:3000
```

기본 포트는 `3000`입니다. hoka-fo-front도 기본 포트가 `3000`이라 둘을 함께 띄우면 충돌합니다. 이때는 이 앱을 `3001`로 띄웁니다.

```bash
pnpm dev -p 3001
pnpm start -p 3001
```

## 빌드

```bash
pnpm build   # 프로덕션 빌드 (.next/)
pnpm start   # 빌드 결과로 서버 실행, http://localhost:3000
pnpm lint    # ESLint (next core-web-vitals + typescript)
```

`pnpm start`는 `pnpm build`를 먼저 실행해야 합니다. 테스트 러너는 아직 없습니다.

## API 연동

백엔드는 [hoka-bo-api](../hoka-bo-api/README.md)를 쓸 예정이며, 아직 API를 호출하는 코드는 없습니다.
