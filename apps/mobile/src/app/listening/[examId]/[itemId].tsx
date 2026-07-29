import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { SentenceItem } from '@/features/listening/api';
import { useItem, useItems, useSaveProgress } from '@/features/listening/use-listening';
import { findCurrentSentence, useHasTimings } from '@/features/listening/use-sentence-sync';
import { useTheme } from '@/hooks/use-theme';

const SPEEDS = [0.75, 1, 1.25];
const PRIMARY_BLUE = '#5BA9FF';

/** 재생 바를 잡기 편하도록 트랙 위아래로 넓히는 여유 */
const SEEK_BAR_HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 };
/** iOS 휴먼 인터페이스 가이드라인 최소 터치 영역 */
const MIN_TOUCH = 44;

/** 직접 스크롤한 뒤 이만큼은 자동 스크롤이 끼어들지 않는다 — 앞 문장을 다시 읽는 중일 수 있다 */
const MANUAL_SCROLL_PAUSE_MS = 4000;
/** 현재 문장이 이 구간(화면 상단 15%~하단 25%) 안에 있으면 굳이 움직이지 않는다 */
const BAND_TOP = 0.15;
const BAND_BOTTOM = 0.75;
/** 스크롤할 때 현재 문장을 화면 위쪽 이 지점에 둔다 */
const ANCHOR = 0.35;

/**
 * 문항 학습 화면.
 *
 * 음원은 문항당 파일 1개이고, 문장을 누르면 그 문장의 start 로 seek 한다.
 * 파일을 문장별로 자르지 않는 이유는 여기서 드러난다 — 이어 듣기·구간 이동이 seek 한 줄이다.
 */
export default function ListeningItemScreen() {
  const { examId, itemId } = useLocalSearchParams<{ examId: string; itemId: string }>();
  const theme = useTheme();
  const router = useRouter();

  const { data, isPending, error } = useItem(itemId);
  const { data: items } = useItems(examId);
  const saveProgress = useSaveProgress(itemId);

  const player = useAudioPlayer(data ? { uri: data.audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  const [showTranslation, setShowTranslation] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const lastSavedRef = useRef(0);

  // 앞뒤 문항 — 목록을 이미 받아두므로 새 API 없이 구한다
  const { prevId, nextId } = useMemo(() => {
    const index = items?.findIndex((item) => item.id === itemId) ?? -1;
    if (index < 0 || !items) return { prevId: undefined, nextId: undefined };
    return { prevId: items[index - 1]?.id, nextId: items[index + 1]?.id };
  }, [items, itemId]);

  const scrollRef = useRef<ScrollView>(null);
  const rowLayoutsRef = useRef<Record<number, { y: number; height: number }>>({});
  const viewportRef = useRef(0);
  const scrollYRef = useRef(0);
  const manualScrollAtRef = useRef(0);

  const sentences = data?.sentences ?? [];
  const hasTimings = useHasTimings(sentences);
  const positionMs = Math.round((status.currentTime ?? 0) * 1000);
  // 음원이 아직 안 읽혔으면 status.duration 이 0 이라 서버가 준 길이로 버틴다
  const durationMs = Math.round((status.duration ?? 0) * 1000) || (data?.durationMs ?? 0);
  const currentIndex = hasTimings ? findCurrentSentence(sentences, positionMs) : -1;

  // 다른 문항으로 넘어오면 이전 문항의 행 위치는 버린다
  useEffect(() => {
    rowLayoutsRef.current = {};
    scrollYRef.current = 0;
    manualScrollAtRef.current = 0;
  }, [data?.id]);

  // 이어듣기 위치 복원
  useEffect(() => {
    if (data && data.lastPositionMs > 0 && status.isLoaded) {
      player.seekTo(data.lastPositionMs / 1000);
    }
    // 최초 로드에서만 복원한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, status.isLoaded]);

  // 진도 저장은 10초에 한 번만. 재생 중 매 틱 보내면 서버가 감당하지 못한다
  useEffect(() => {
    if (!status.playing) return;
    if (positionMs - lastSavedRef.current < 10_000) return;

    lastSavedRef.current = positionMs;
    saveProgress.mutate({
      lastPositionMs: positionMs,
      completed: status.duration > 0 && status.currentTime / status.duration > 0.9,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionMs, status.playing]);

  const handleRowLayout = useCallback((index: number, y: number, height: number) => {
    rowLayoutsRef.current[index] = { y, height };
  }, []);

  // 재생을 따라 현재 문장을 화면 안에 유지한다.
  // 문장마다 스크롤하면 짧은 문장에서 화면이 계속 흔들리므로, 편한 구간을 벗어났을 때만 움직인다.
  useEffect(() => {
    if (currentIndex < 0) return;

    const row = rowLayoutsRef.current[currentIndex];
    const viewport = viewportRef.current;
    if (!row || viewport <= 0) return;

    if (Date.now() - manualScrollAtRef.current < MANUAL_SCROLL_PAUSE_MS) return;

    const visibleTop = scrollYRef.current;
    const bandTop = visibleTop + viewport * BAND_TOP;
    const bandBottom = visibleTop + viewport * BAND_BOTTOM;
    if (row.y >= bandTop && row.y + row.height <= bandBottom) return;

    scrollRef.current?.scrollTo({ y: Math.max(0, row.y - viewport * ANCHOR), animated: true });
  }, [currentIndex]);

  function handleSentencePress(sentence: SentenceItem) {
    if (!hasTimings) return;
    // 직접 고른 문장이니 자동 스크롤을 다시 켠다
    manualScrollAtRef.current = 0;
    player.seekTo(sentence.startMs / 1000);
    if (!status.playing) player.play();
  }

  function changeSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    player.setPlaybackRate(next, 'high');
  }

  /** 재생 바에서 손을 뗐을 때. SeekBar 가 PanResponder 를 재생성하지 않도록 안정적으로 유지한다 */
  const handleSeek = useCallback(
    (ms: number) => {
      // 직접 이동한 것이니 자동 스크롤을 다시 켠다
      manualScrollAtRef.current = 0;
      player.seekTo(ms / 1000);
      setScrubMs(null);
    },
    [player],
  );

  /**
   * 문항 이동.
   * 진도 저장이 10초 주기라 이동 직전 재생분이 유실된다 — 넘어가기 전에 한 번 저장한다.
   */
  function goToItem(targetId: string | undefined) {
    if (!targetId) return;

    if (positionMs > 0) {
      saveProgress.mutate({
        lastPositionMs: positionMs,
        completed: status.duration > 0 && status.currentTime / status.duration > 0.9,
      });
    }
    // push 로 쌓으면 문항을 넘길 때마다 뒤로가기 스택이 길어진다
    router.replace(`/listening/${examId}/${targetId}`);
  }

  if (isPending) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !data) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="small" themeColor="textSecondary">
          문항을 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <View style={styles.headerTop}>
          {/* 발문에 가려 지금이 몇 번인지 안 보이던 문제 — 번호를 앞에 세운다 */}
          <View style={styles.itemNoBadge}>
            <ThemedText type="smallBold" style={styles.itemNoText}>
              {data.itemNo}번
            </ThemedText>
          </View>

          {items && items.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              전체 {items.length}문항
            </ThemedText>
          ) : null}

          <View style={styles.headerSpacer} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showTranslation ? '해석 끄기' : '해석 보기'}
            onPress={() => setShowTranslation((prev) => !prev)}
            style={[
              styles.chip,
              {
                backgroundColor: showTranslation ? PRIMARY_BLUE : theme.backgroundElement,
                borderColor: showTranslation ? PRIMARY_BLUE : theme.backgroundSelected,
              },
            ]}>
            <ThemedText type="small" style={showTranslation ? styles.chipTextActive : undefined}>
              해석 {showTranslation ? '끄기' : '보기'}
            </ThemedText>
          </Pressable>
        </View>

        {data.questionText ? (
          <ThemedText type="small" numberOfLines={2}>
            {data.questionText}
          </ThemedText>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.script}
        scrollEventThrottle={16}
        onLayout={(e) => {
          viewportRef.current = e.nativeEvent.layout.height;
        }}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        onScrollBeginDrag={() => {
          manualScrollAtRef.current = Date.now();
        }}>
        {sentences.map((sentence, index) => (
          <SentenceRow
            key={sentence.id}
            index={index}
            sentence={sentence}
            active={index === currentIndex}
            showTranslation={showTranslation}
            seekable={hasTimings}
            onLayout={handleRowLayout}
            onPress={() => handleSentencePress(sentence)}
          />
        ))}

        {!hasTimings ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.notice}>
            아직 문장별 싱크가 없어 문장 이동은 할 수 없어요
          </ThemedText>
        ) : null}
      </ScrollView>

      <View style={[styles.player, { borderTopColor: theme.backgroundElement }]}>
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
            label="이전 문항"
            disabled={!prevId}
            onPress={() => goToItem(prevId)}
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
            {/* 크기를 고정해 재생↔일시정지 전환에도 레이아웃이 흔들리지 않게 한다 */}
            <SymbolView
              name={{
                ios: status.playing ? 'pause.fill' : 'play.fill',
                android: status.playing ? 'pause' : 'play_arrow',
                web: status.playing ? 'pause' : 'play_arrow',
              }}
              size={24}
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
            label="다음 문항"
            disabled={!nextId}
            onPress={() => goToItem(nextId)}
          />

          {/* 배속은 값을 읽어야 하므로 아이콘으로 바꾸지 않는다 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`재생 속도 ${speed}배`}
            onPress={changeSpeed}
            style={[styles.controlButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{speed}x</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

/**
 * 자유 이동 재생 바.
 *
 * 슬라이더 패키지가 설치돼 있지 않아 PanResponder 로 직접 만든다.
 * 끄는 동안에는 재생 위치가 썸을 밀어내지 않도록 부모가 scrubMs 를 들고 있는다.
 */
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
      const ratio = Math.min(1, Math.max(0, x / width));
      return Math.round(ratio * durationMs);
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

/** 44×44 터치 영역과 accessibilityLabel 을 강제하는 아이콘 버튼 */
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

function SentenceRow({
  index,
  sentence,
  active,
  showTranslation,
  seekable,
  onLayout,
  onPress,
}: {
  index: number;
  sentence: SentenceItem;
  active: boolean;
  showTranslation: boolean;
  seekable: boolean;
  onLayout: (index: number, y: number, height: number) => void;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!seekable}
      onLayout={(e: LayoutChangeEvent) => {
        const { y, height } = e.nativeEvent.layout;
        onLayout(index, y, height);
      }}
      style={[
        styles.sentence,
        { backgroundColor: active ? theme.backgroundSelected : 'transparent' },
        active ? styles.sentenceActive : null,
      ]}>
      <View style={styles.sentenceHead}>
        {sentence.speaker ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.speaker}>
            {sentence.speaker}
          </ThemedText>
        ) : null}
        <ThemedText type={active ? 'smallBold' : 'small'} style={styles.textEn}>
          {sentence.textEn}
        </ThemedText>
      </View>

      {showTranslation && sentence.textKo ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.textKo}>
          {sentence.textKo}
        </ThemedText>
      ) : null}
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
  header: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSpacer: { flex: 1 },
  itemNoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: PRIMARY_BLUE,
  },
  itemNoText: { color: '#ffffff' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipTextActive: { color: '#ffffff' },
  script: { padding: 16, gap: 4 },
  sentence: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  sentenceActive: { borderLeftWidth: 3, borderLeftColor: PRIMARY_BLUE },
  sentenceHead: { flexDirection: 'row', gap: 8 },
  speaker: { width: 22 },
  textEn: { flex: 1 },
  textKo: { paddingLeft: 30 },
  notice: { textAlign: 'center', paddingVertical: 16 },
  player: { paddingHorizontal: 16, paddingVertical: 12, gap: 6, borderTopWidth: 1 },

  seekBar: { height: 20, justifyContent: 'center' },
  seekTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  seekFill: { height: '100%', backgroundColor: PRIMARY_BLUE },
  seekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: PRIMARY_BLUE,
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
  controlButton: {
    minWidth: MIN_TOUCH,
    height: MIN_TOUCH,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 재생↔일시정지로 라벨이 바뀌어도 폭이 변하지 않도록 크기를 고정한다
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BLUE,
    marginHorizontal: 4,
  },
});
