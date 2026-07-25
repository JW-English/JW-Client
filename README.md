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

## 현재 상태 (P0)

- [x] Expo Router 기반 앱 스캐폴딩 + 다크모드
- [x] TanStack Query 설정
- [x] 홈 화면: 서버 헬스체크 카드 + 기능 그리드(Coming Soon)
- [x] OpenAPI 타입 생성 파이프라인
- [ ] 소셜 로그인 / SecureStore 토큰 저장 (P1)
- [ ] Next.js 관리자 웹 (P2)
