import type { AudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

/**
 * 잠금화면·제어센터 재생 컨트롤을 붙인다.
 *
 * 편의 기능처럼 보이지만 **안드로이드에서는 필수**다. expo-audio 문서에 따르면
 * 잠금화면 컨트롤을 켜지 않으면 백그라운드 재생이 약 3분 뒤 OS 에 의해 끊긴다.
 * 듣기 한 회차가 25분이라 이게 없으면 등하교 중 학습이 성립하지 않는다.
 */
export function useLockScreenControls(
  player: AudioPlayer,
  metadata: { title: string; artist: string } | null,
) {
  const title = metadata?.title;
  const artist = metadata?.artist;

  useEffect(() => {
    if (!title) return;

    player.setActiveForLockScreen(true, { title, artist });

    return () => {
      // 화면을 벗어나면 잠금화면에 남은 정보를 지운다
      player.clearLockScreenControls();
    };
  }, [player, title, artist]);
}
