import { useState } from 'react';

import { ApiError } from '@/lib/api';

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
    setMessage('네트워크 연결을 확인해 주세요.');
  }

  return { message, fields, capture, clear };
}
