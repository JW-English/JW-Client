import { useMemo } from 'react';

import type { SentenceItem } from './api';

/**
 * 재생 위치로 현재 문장을 찾는다.
 *
 * 매 틱마다 배열을 처음부터 훑으면 문장이 많을 때 낭비다 —
 * start_ms 가 정렬돼 있으므로 이진 탐색한다.
 */
export function findCurrentSentence(sentences: SentenceItem[], positionMs: number): number {
  let low = 0;
  let high = sentences.length - 1;
  let found = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const sentence = sentences[mid];

    if (positionMs < sentence.startMs) {
      high = mid - 1;
    } else if (positionMs > sentence.endMs) {
      low = mid + 1;
    } else {
      return mid;
    }
    // 구간 사이(문장 간 공백)에 있으면 직전 문장을 유지한다
    if (positionMs >= sentence.startMs) {
      found = mid;
    }
  }

  return found;
}

/** 타임스탬프가 아직 없는 문항인지. (정렬 전에는 전부 0이다) */
export function useHasTimings(sentences: SentenceItem[]) {
  return useMemo(
    () => sentences.some((sentence) => sentence.endMs > sentence.startMs),
    [sentences],
  );
}
