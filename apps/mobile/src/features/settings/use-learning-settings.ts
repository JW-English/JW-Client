import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'settings:learning';

export type LearningSettings = {
  /** 듣기 기본 재생 속도 */
  playbackRate: number;
  /** 문항 화면에서 해석을 기본으로 펼칠지 */
  showTranslation: boolean;
  /** 재생에 맞춰 대본을 따라 스크롤할지 */
  autoScroll: boolean;
};

export const DEFAULT_LEARNING_SETTINGS: LearningSettings = {
  playbackRate: 1,
  showTranslation: true,
  autoScroll: true,
};

export const PLAYBACK_RATES = [0.75, 1, 1.25];

/**
 * 학습 기본값. 서버에 둘 이유가 없어 기기에 저장한다.
 *
 * 듣기 화면이 매번 읽으므로 로딩 중에는 기본값으로 동작하게 둔다 —
 * 값이 늦게 와서 화면이 깜빡이는 것보다 낫다.
 */
export function useLearningSettings() {
  const [settings, setSettings] = useState<LearningSettings>(DEFAULT_LEARNING_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!alive) return;
      if (raw) {
        try {
          setSettings({ ...DEFAULT_LEARNING_SETTINGS, ...JSON.parse(raw) });
        } catch {
          // 깨졌으면 기본값으로 둔다
        }
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<LearningSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, loaded, update };
}
