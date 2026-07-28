import { useCallback, useEffect, useState } from 'react';

import { withAuth } from '@/lib/with-auth';

import { fetchAttempt, saveAnswer, type AttemptResponse } from './api';
import { useSubmitQuiz } from './use-vocabulary';

type Options = {
  onFinish: () => void;
  onError: (message: string) => void;
};

/**
 * 시험 진행 상태.
 *
 * 답 저장은 화면을 막지 않는다 — 저장이 느려도 다음 문항으로 넘어갈 수 있어야 한다.
 * 마지막 문항을 고르면 자동으로 제출한다.
 */
export function useQuizSession(attemptId: string, { onFinish, onError }: Options) {
  const [attempt, setAttempt] = useState<AttemptResponse | null>(null);
  const [index, setIndex] = useState(0);
  const submit = useSubmitQuiz(attemptId);

  useEffect(() => {
    let cancelled = false;
    withAuth((token) => fetchAttempt(token, attemptId))
      .then((data) => {
        if (cancelled) return;
        setAttempt(data);
        // 이어하기: 아직 답하지 않은 첫 문항부터 시작한다.
        // 서버가 null 필드를 응답에서 빼므로 undefined 도 함께 잡아야 한다 (== null)
        const next = data.questions.findIndex((question) => question.selectedIndex == null);
        setIndex(next === -1 ? 0 : next);
      })
      .catch((error: Error) => onError(error.message));

    return () => {
      cancelled = true;
    };
  }, [attemptId, onError]);

  const select = useCallback(
    async (choiceIndex: number) => {
      if (!attempt) return;
      const question = attempt.questions[index];

      try {
        await withAuth((token) =>
          saveAnswer(token, attemptId, { wordId: question.wordId, selectedIndex: choiceIndex }),
        );
      } catch (error) {
        onError(error instanceof Error ? error.message : '답을 저장하지 못했습니다');
        return;
      }

      const isLast = index >= attempt.questions.length - 1;
      if (!isLast) {
        setIndex(index + 1);
        return;
      }

      try {
        await submit.mutateAsync();
        onFinish();
      } catch (error) {
        onError(error instanceof Error ? error.message : '제출하지 못했습니다');
      }
    },
    [attempt, attemptId, index, onError, onFinish, submit],
  );

  return {
    attempt,
    current: attempt?.questions[index] ?? null,
    index,
    total: attempt?.questions.length ?? 0,
    select,
    submitting: submit.isPending,
  };
}
