const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/**
 * Access Token 은 <b>메모리에만</b> 둔다.
 * localStorage 에 두면 XSS 로 새어나가고, 그럴 거면 쿠키를 쓴 의미가 없다.
 * 새로고침하면 사라지지만 httpOnly 쿠키의 Refresh 로 곧바로 복구된다.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export type ProblemDetail = {
  status: number;
  detail?: string;
  code?: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem?: ProblemDetail,
  ) {
    super(problem?.detail ?? `요청에 실패했습니다 (${status})`);
    this.name = 'ApiError';
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown };

async function request<T>(path: string, options: Options = {}, retried = false): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    // 쿠키를 주고받아야 하므로 반드시 include. CORS 는 서버에서 허용된 오리진만 통과한다
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access Token 만료(30분)는 정상 상황이다 — 쿠키로 한 번 갱신하고 재시도한다
  if (response.status === 401 && !retried && !path.startsWith('/api/auth/web/')) {
    const renewed = await refreshSession();
    if (renewed) {
      return request<T>(path, options, true);
    }
  }

  if (!response.ok) {
    const problem = await response.json().catch(() => undefined);
    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
};

/** 쿠키의 Refresh Token 으로 세션을 되살린다. 실패하면 로그인 화면으로 보내야 한다. */
export async function refreshSession(): Promise<boolean> {
  try {
    const result = await request<{ accessToken: string }>('/api/auth/web/refresh', {
      method: 'POST',
    });
    setAccessToken(result.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function login(email: string, password: string) {
  const result = await request<{ accessToken: string }>('/api/auth/web/login', {
    method: 'POST',
    body: { email, password },
  });
  setAccessToken(result.accessToken);
}

export async function logout() {
  await request<void>('/api/auth/web/logout', { method: 'POST' }).catch(() => undefined);
  setAccessToken(null);
}
