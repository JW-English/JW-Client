/// <reference types="expo/types" />

// expo-env.d.ts 와 같은 내용이지만 이 파일은 우리가 관리한다.
// expo-env.d.ts 는 expo CLI 가 매번 재생성하면서 .gitignore 에 다시 등록하므로
// 커밋 상태를 유지할 수 없다. CI 는 expo 실행 없이 tsc 를 돌리므로
// 이 선언이 없으면 CSS 모듈 등의 타입을 찾지 못해 깨진다.
