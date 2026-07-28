import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { SentenceItem } from '@/features/listening/api';
import { useItem, useSaveProgress } from '@/features/listening/use-listening';
import { findCurrentSentence, useHasTimings } from '@/features/listening/use-sentence-sync';
import { useTheme } from '@/hooks/use-theme';

const SPEEDS = [0.75, 1, 1.25];

/**
 * 문항 학습 화면.
 *
 * 음원은 문항당 파일 1개이고, 문장을 누르면 그 문장의 start 로 seek 한다.
 * 파일을 문장별로 자르지 않는 이유는 여기서 드러난다 — 이어 듣기·구간 이동이 seek 한 줄이다.
 */
export default function ListeningItemScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const theme = useTheme();

  const { data, isPending, error } = useItem(itemId);
  const saveProgress = useSaveProgress(itemId);

  const player = useAudioPlayer(data ? { uri: data.audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  const [showTranslation, setShowTranslation] = useState(true);
  const [speed, setSpeed] = useState(1);
  const lastSavedRef = useRef(0);

  const sentences = data?.sentences ?? [];
  const hasTimings = useHasTimings(sentences);
  const positionMs = Math.round((status.currentTime ?? 0) * 1000);
  const currentIndex = hasTimings ? findCurrentSentence(sentences, positionMs) : -1;

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

  function handleSentencePress(sentence: SentenceItem) {
    if (!hasTimings) return;
    player.seekTo(sentence.startMs / 1000);
    if (!status.playing) player.play();
  }

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
        <ThemedText type="small" numberOfLines={2}>
          {data.questionText ?? `${data.itemNo}번 문항`}
        </ThemedText>
        <Pressable
          onPress={() => setShowTranslation((prev) => !prev)}
          style={[
            styles.chip,
            {
              backgroundColor: showTranslation ? Palette.primary : theme.backgroundElement,
              borderColor: showTranslation ? Palette.primary : theme.backgroundSelected,
            },
          ]}>
          <ThemedText type="small" style={showTranslation ? styles.chipTextActive : undefined}>
            해석 {showTranslation ? '끄기' : '보기'}
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.script}>
        {sentences.map((sentence, index) => (
          <SentenceRow
            key={sentence.id}
            sentence={sentence}
            active={index === currentIndex}
            showTranslation={showTranslation}
            seekable={hasTimings}
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
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(status.currentTime ?? 0)} / {formatTime(status.duration ?? 0)}
        </ThemedText>

        <View style={styles.controls}>
          <Pressable
            onPress={() => player.seekTo(Math.max(0, (status.currentTime ?? 0) - 5))}
            style={[styles.controlButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">-5초</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => (status.playing ? player.pause() : player.play())}
            style={[styles.playButton]}>
            <ThemedText type="smallBold" style={styles.playText}>
              {status.playing ? '일시정지' : '재생'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => player.seekTo((status.currentTime ?? 0) + 5)}
            style={[styles.controlButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">+5초</ThemedText>
          </Pressable>

          <Pressable
            onPress={changeSpeed}
            style={[styles.controlButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{speed}x</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

function SentenceRow({
  sentence,
  active,
  showTranslation,
  seekable,
  onPress,
}: {
  sentence: SentenceItem;
  active: boolean;
  showTranslation: boolean;
  seekable: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!seekable}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipTextActive: { color: '#ffffff' },
  script: { padding: 16, gap: 4 },
  sentence: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  sentenceActive: { borderLeftWidth: 3, borderLeftColor: Palette.primary },
  sentenceHead: { flexDirection: 'row', gap: 8 },
  speaker: { width: 22 },
  textEn: { flex: 1 },
  textKo: { paddingLeft: 30 },
  notice: { textAlign: 'center', paddingVertical: 16 },
  player: { padding: 16, gap: 10, borderTopWidth: 1, alignItems: 'center' },
  controls: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  controlButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  playButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Palette.primary,
  },
  playText: { color: '#ffffff' },
});
