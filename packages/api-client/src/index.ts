import type { components, paths } from './schema';

export type { components, paths };

/** 스키마 이름으로 DTO 타입을 꺼내 쓴다. 예) Dto<'PingResponse'> */
export type Dto<K extends keyof components['schemas']> = components['schemas'][K];

/** 엔드포인트의 200 응답 본문 타입. */
export type ApiResponse<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { responses: { 200: { content: { 'application/json': infer R } } } }
  ? R
  : never;
