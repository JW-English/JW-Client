# jungwoon-client

정운영어 클라이언트 모노레포 (npm workspaces).
서버는 **별도 저장소**다 — `JW-English/backend` (Spring Boot).

```
apps/
  mobile/            # Expo (React Native) 학생 앱
  admin/             # Next.js 관리자 웹 (P2 에서 추가 예정)
packages/
  api-client/        # 서버 OpenAPI 스펙에서 생성한 공용 타입
```

> 기획안은 pnpm + Turborepo 를 상정했지만, 로컬에 pnpm 이 없어 우선 **npm workspaces** 로 구성했다.
> 워크스페이스 구조가 같으므로 나중에 pnpm 으로 옮기는 비용은 작다.

## 실행

```bash
npm install                 # 루트에서 한 번
cp apps/mobile/.env.example apps/mobile/.env

npm run mobile              # Expo 개발 서버 (i / a / w 로 플랫폼 선택)
npm run typecheck           # 전체 타입 검사
```

앱은 `EXPO_PUBLIC_API_URL` 로 서버를 찾는다. **실기기에서는 `localhost` 가 아니라 개발 PC 의
LAN IP** 를 넣어야 한다.

## API 타입 동기화

두 저장소를 잇는 계약은 서버의 **OpenAPI 스펙**이다. 서버(`backend`)를 띄운 상태에서:

```bash
npm run generate --workspace=@jungwoon/api-client
```

`packages/api-client/src/schema.d.ts` 는 생성물이지만 커밋한다. 서버 API 가 바뀌면 재생성 →
클라이언트에서 **컴파일 에러로 즉시 드러난다.**

## 타입 검사에 대해 알아둘 것

`.expo/types/router.d.ts`(타입 라우트)는 `expo start` 가 만드는 생성물이라 커밋하지 않는다.
따라서 **잘못된 경로 문자열은 로컬에서만 잡히고 CI 는 통과**한다. 화면을 추가한 뒤에는
개발 서버를 한 번 띄워 타입을 갱신하고 `npm run typecheck` 를 돌리는 게 안전하다.

`expo-env.d.ts` 도 CLI 가 매번 재생성하며 `.gitignore` 에 다시 등록하므로, 같은 선언을
`apps/mobile/types/globals.d.ts` 에 두고 그쪽을 커밋한다. (이게 없으면 CI 가 깨진다)

## 인증 (P1)

이메일 회원가입·로그인이 동작한다. 토큰은 `expo-secure-store` 에 저장되고 앱을 다시 켜면
세션이 복구된다. Access Token 이 만료되면 Refresh 로 자동 교체하고, 그마저 실패하면
(재사용 감지 등) 토큰을 지우고 로그인 화면으로 보낸다.

**소셜 로그인은 개발자 앱 검수 이후에 붙인다.** 카카오·네이버 검수는 실제 회원가입 화면
캡처를 요구하므로 이메일 경로를 먼저 완성했다.

확인하려면 서버를 띄운 뒤:

```bash
cd ../Jungwoon/jungwoon-api && docker compose up -d && ./gradlew :api:bootRun   # 서버
npm run mobile                                                                  # 앱
```

## 현재 상태

- [x] Expo Router 기반 앱 스캐폴딩 + 다크모드
- [x] TanStack Query 설정
- [x] OpenAPI 타입 생성 파이프라인
- [x] 이메일 회원가입·로그인, 토큰 보관(SecureStore), 인증 게이트
- [ ] 온보딩(학년·학교·반 코드) — 서버 API 먼저 필요
- [ ] 소셜 로그인 (검수 완료 후)
- [ ] Next.js 관리자 웹 (P2)
