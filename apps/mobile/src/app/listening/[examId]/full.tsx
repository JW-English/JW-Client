import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { usePlaylist } from '@/features/listening/use-listening';
import { useTheme } from '@/hooks/use-theme';

const SPEEDS = [0.75, 1, 1.25];
const MIN_TOUCH = 44;
const SEEK_BAR_HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 };

/**
 * 전체 듣기.
 *
 * 안내 방송부터 마지막 문항까지 끊지 않고 이어 재생한다. 실전 감각을 위한 화면이라
 * 대본은 일부러 보여주지 않는다 — 보면서 들으려면 문항 화면으로 들어가면 된다.
 */
export default function ListeningFullPlayScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const theme = useTheme();

  const { data, isPending, error } = usePlaylist(examId);
  const tracks = useMemo(() => data?.tracks ?? [], [data]);

  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const current = tracks[index];
  const player = useAudioPlayer(current ? { uri: current.audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  const positionMs = Math.round((status.currentTime ?? 0) * 1000);
  const durationMs = Math.round((status.duration ?? 0) * 1000) || (current?.durationMs ?? 0);

  // 트랙이 끝나면 다음으로 넘어간다. 이게 전체 듣기의 핵심이다.
  // 상태를 이펙트 본문이 아니라 이벤트 콜백에서 바꾼다 — 재생 종료는 외부 이벤트다
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (!s.didJustFinish) return;
      setIndex((prev) => (prev < tracks.length - 1 ? prev + 1 : prev));
      setFinished((prev) => (index >= tracks.length - 1 ? true : prev));
    });
    return () => sub.remove();
  }, [player, index, tracks.length]);

  // 트랙이 바뀌면 이어서 재생한다. 마지막까지 듣고 멈춘 뒤에는 자동 재생하지 않는다
  useEffect(() => {
    if (!status.isLoaded || finished) return;
    player.setPlaybackRate(speed, 'high');
    player.play();
    // 트랙 전환 시점에만 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, status.isLoaded]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= tracks.length) return;
      setFinished(false);
      setScrubMs(null);
      setIndex(next);
    },
    [tracks.length],
  );

  const handleSeek = useCallback(
    (ms: number) => {
      player.seekTo(ms / 1000);
      setScrubMs(null);
    },
    [player],
  );

  function changeSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    player.setPlaybackRate(next, 'high');
  }

  if (isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !data || tracks.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          재생할 음원을 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.stage}>
        <ThemedText type="small" themeColor="textSecondary">
          {data.examLabel}
        </ThemedText>

        <ThemedText type="title" style={styles.trackLabel}>
          {current?.label}
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary">
          {index + 1} / {tracks.length}
        </ThemedText>

        {finished ? (
          <ThemedText type="small" style={styles.finished}>
            끝까지 들었어요
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.playerArea}>
        <SeekBar
          positionMs={scrubMs ?? positionMs}
          durationMs={durationMs}
          onScrub={setScrubMs}
          onSeek={handleSeek}
        />

        <View style={styles.times}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatTime((scrubMs ?? positionMs) / 1000)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatTime(durationMs / 1000)}
          </ThemedText>
        </View>

        <View style={styles.controls}>
          <IconButton
            ios="backward.end.fill"
            android="skip_previous"
            label="이전 트랙"
            disabled={index === 0}
            onPress={() => goTo(index - 1)}
          />
          <IconButton
            ios="gobackward.5"
            android="replay_5"
            label="5초 뒤로"
            onPress={() => player.seekTo(Math.max(0, (status.currentTime ?? 0) - 5))}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={status.playing ? '일시정지' : '재생'}
            onPress={() => (status.playing ? player.pause() : player.play())}
            style={styles.playButton}>
            <SymbolView
              name={{
                ios: status.playing ? 'pause.fill' : 'play.fill',
                android: status.playing ? 'pause' : 'play_arrow',
                web: status.playing ? 'pause' : 'play_arrow',
              }}
              size={26}
              tintColor="#ffffff"
              weight={{ ios: 'semibold', android: { name: 'outlined', font: 500 } }}
            />
          </Pressable>

          <IconButton
            ios="goforward.5"
            android="forward_5"
            label="5초 앞으로"
            onPress={() => player.seekTo((status.currentTime ?? 0) + 5)}
          />
          <IconButton
            ios="forward.end.fill"
            android="skip_next"
            label="다음 트랙"
            disabled={index >= tracks.length - 1}
            onPress={() => goTo(index + 1)}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`재생 속도 ${speed}배`}
            onPress={changeSpeed}
            style={[styles.speedButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{speed}x</ThemedText>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.trackList}>
        {tracks.map((track, i) => (
          <Pressable
            key={`${track.kind}-${track.itemId ?? 'intro'}`}
            accessibilityRole="button"
            accessibilityState={{ selected: i === index }}
            onPress={() => goTo(i)}
            style={[
              styles.trackRow,
              {
                backgroundColor: i === index ? theme.backgroundSelected : 'transparent',
              },
            ]}>
            <ThemedText type={i === index ? 'smallBold' : 'small'}>{track.label}</ThemedText>
            {i < index ? (
              <ThemedText type="small" style={styles.played}>
                들음
              </ThemedText>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

/** 문항 화면과 같은 방식. 슬라이더 패키지가 없어 PanResponder 로 만든다 */
function SeekBar({
  positionMs,
  durationMs,
  onScrub,
  onSeek,
}: {
  positionMs: number;
  durationMs: number;
  onScrub: (ms: number) => void;
  onSeek: (ms: number) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const msAt = useCallback(
    (x: number) => {
      if (width <= 0 || durationMs <= 0) return 0;
      return Math.round(Math.min(1, Math.max(0, x / width)) * durationMs);
    },
    [width, durationMs],
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => onScrub(msAt(e.nativeEvent.locationX)),
        onPanResponderMove: (e) => onScrub(msAt(e.nativeEvent.locationX)),
        onPanResponderRelease: (e) => onSeek(msAt(e.nativeEvent.locationX)),
        onPanResponderTerminate: (e) => onSeek(msAt(e.nativeEvent.locationX)),
      }),
    [msAt, onScrub, onSeek],
  );

  const ratio = durationMs > 0 ? Math.min(1, Math.max(0, positionMs / durationMs)) : 0;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="재생 위치"
      accessibilityValue={{ now: Math.round(ratio * 100), min: 0, max: 100 }}
      hitSlop={SEEK_BAR_HIT_SLOP}
      style={styles.seekBar}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}>
      <View style={[styles.seekTrack, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.seekFill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={[styles.seekThumb, { left: `${ratio * 100}%` }]} />
    </View>
  );
}

function IconButton({
  ios,
  android,
  label,
  onPress,
  disabled,
}: {
  ios: SymbolViewProps['name'];
  android: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconButton, disabled ? styles.iconButtonDisabled : null]}>
      <SymbolView
        name={{ ios, android, web: android } as SymbolViewProps['name']}
        size={20}
        tintColor={theme.text}
        weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
      />
    </Pressable>
  );
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${`${total % 60}`.padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  stage: { alignItems: 'center', gap: 6, paddingVertical: 28 },
  trackLabel: { marginVertical: 2 },
  finished: { color: Palette.success, marginTop: 4 },

  playerArea: { paddingHorizontal: 20, gap: 6 },
  seekBar: { height: 20, justifyContent: 'center' },
  seekTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  seekFill: { height: '100%', backgroundColor: Palette.primary },
  seekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: Palette.primary,
  },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: { flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: { opacity: 0.3 },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    marginHorizontal: 4,
  },
  speedButton: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trackList: { padding: 20, gap: 2 },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  played: { color: Palette.success },
});
