import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { flushProgressQueue } from './progress-queue';

/**
 * 온라인 여부.
 *
 * 오프라인 학습을 붙이면서 필요해졌다 — 다운로드 버튼을 막고,
 * 온라인으로 돌아오면 쌓인 진도를 보낸다.
 */
export function useIsOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      // isInternetReachable 은 확인 전 null 이라 그때는 연결됨으로 본다
      setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false);
    });
  }, []);

  return online;
}

/** 온라인으로 돌아오면 쌓인 진도를 보낸다. 앱 최상단에서 한 번만 건다 */
export function useProgressQueueFlush() {
  useEffect(() => {
    flushProgressQueue().catch(() => {});

    return NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        flushProgressQueue().catch(() => {});
      }
    });
  }, []);
}
