/**
 * 서버 통신 공통 클라이언트.
 *
 * baseUrl 은 EXPO_PUBLIC_API_URL 로 주입한다.
 * 실기기에서 로컬 서버를 붙일 때는 localhost 가 아니라 개발 PC 의 LAN IP 를 넣어야 한다.
 * (예: EXPO_PUBLIC_API_URL=http://192.168.0.10:8080)
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

/** 서버가 내려주는 RFC 7807 ProblemDetail */
export type ProblemDetail = {
  status: number;
  title?: string;
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

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** P1 에서 SecureStore 의 access token 을 주입한다. */
  accessToken?: string;
  timeoutMs?: number;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, timeoutMs = 10_000, headers, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => undefined);
      throw new ApiError(response.status, problem);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const API_BASE_URL = BASE_URL;
