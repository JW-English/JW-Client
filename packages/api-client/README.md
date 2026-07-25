# @jungwoon/api-client

서버의 OpenAPI 스펙에서 생성한 타입. **앱·관리자 웹이 공유하는 API 계약**이다.

```bash
# 서버를 띄운 뒤
npm run generate --workspace=@jungwoon/api-client
```

`src/schema.d.ts` 는 **생성물이지만 커밋한다.** 백엔드 API 가 바뀌면 재생성 → 클라이언트에서
컴파일 에러로 즉시 드러난다. 언어가 다른 만큼 이 자동화가 없으면 런타임에서 터진다.
