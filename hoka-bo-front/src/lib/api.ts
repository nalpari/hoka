// 백오피스 API 호출. 브라우저가 아니라 Next 서버에서만 부른다.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly detail: string,
    readonly lockReason?: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export function apiBaseUrl() {
  const url = process.env.BO_API_BASE_URL;
  if (!url) {
    throw new Error("BO_API_BASE_URL이 없습니다. .env.example을 보고 .env.local을 만드세요.");
  }
  return url.replace(/\/$/, "");
}

type CallOptions = {
  method?: string;
  body?: unknown;
  accessToken?: string;
  /** 로그인 이력에 남길 브라우저 정보. BFF를 거치므로 API는 이 헤더를 보고 기록한다. */
  clientIp?: string;
  userAgent?: string;
};

export async function callApi<T>(path: string, options: CallOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
  if (options.clientIp) headers["X-Forwarded-For"] = options.clientIp;
  if (options.userAgent) headers["User-Agent"] = options.userAgent;

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

// API는 RFC 9457 ProblemDetail에 code를 실어 준다. 같은 상태 코드의 이유를 그걸로 가른다.
async function toApiError(response: Response) {
  let code = "UNKNOWN";
  let detail = "";
  let lockReason: string | undefined;
  try {
    const problem = (await response.json()) as { code?: string; detail?: string; lockReason?: string };
    code = problem.code ?? code;
    detail = problem.detail ?? "";
    lockReason = problem.lockReason;
  } catch {
    // 본문이 비었거나 JSON이 아니면 상태 코드만 가지고 판단한다.
  }
  return new ApiError(response.status, code, detail, lockReason);
}
