import Constants from 'expo-constants';

/**
 * 서버 통신 공통 클라이언트.
 *
 * baseUrl 결정 순서
 *  1. EXPO_PUBLIC_API_URL (운영·스테이징에서 명시적으로 주입)
 *  2. Expo 개발 서버가 알려주는 호스트 + 8080
 *  3. localhost:8080
 *
 * 2번이 중요하다. 실기기나 에뮬레이터에서 localhost 는 **기기 자신**을 가리키므로
 * 개발 PC 의 서버에 닿지 않는다. Expo 가 이미 알고 있는 개발 PC 주소를 재사용해
 * 매번 LAN IP 를 손으로 넣는 실수를 없앤다.
 */
const DEFAULT_PORT = 8080;

function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${DEFAULT_PORT}`;

  return `http://localhost:${DEFAULT_PORT}`;
}

const BASE_URL = resolveBaseUrl();

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

/**
 * 서버에 닿지 못한 경우. 어느 주소로 시도했는지 담아둔다 —
 * "네트워크를 확인하세요"만 띄우면 개발 중에 원인을 못 찾는다.
 */
export class NetworkError extends Error {
  constructor(readonly url: string) {
    super(`서버에 연결하지 못했습니다: ${url}`);
    this.name = 'NetworkError';
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

  const url = `${BASE_URL}${path}`;

  try {
    let response: Response;
    try {
      response = await fetch(url, {
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
    } catch {
      // 연결 실패·타임아웃·CORS 차단은 전부 여기로 온다
      throw new NetworkError(url);
    }

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
