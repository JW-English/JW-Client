import { useState } from 'react';

import { ApiError, NetworkError } from '@/lib/api';

type FieldErrors = Record<string, string>;

/**
 * 서버가 내려주는 ProblemDetail 을 화면에 뿌릴 형태로 바꾼다.
 * 필드 단위 사유(fields)가 있으면 해당 입력칸 아래에, 없으면 폼 상단에 표시한다.
 */
export function useFormError() {
  const [message, setMessage] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors>({});

  function clear() {
    setMessage(null);
    setFields({});
  }

  function capture(error: unknown) {
    if (error instanceof ApiError) {
      setFields(error.problem?.fields ?? {});
      // 필드 사유가 따로 있으면 상단 메시지는 중복이라 생략한다
      setMessage(error.problem?.fields ? null : error.message);
      return;
    }
    setFields({});

    if (error instanceof NetworkError) {
      // 개발 중에는 어느 주소로 시도했는지 보여줘야 원인을 찾을 수 있다
      setMessage(
        __DEV__
          ? `서버에 연결하지 못했습니다.\n요청 주소: ${error.url}`
          : '네트워크 연결을 확인해 주세요.',
      );
      return;
    }

    setMessage('네트워크 연결을 확인해 주세요.');
  }

  return { message, fields, capture, clear };
}
