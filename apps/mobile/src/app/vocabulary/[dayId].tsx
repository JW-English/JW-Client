import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { WordItem } from '@/features/vocabulary/api';
import { useDay, useStartQuiz } from '@/features/vocabulary/use-vocabulary';
import { useTheme } from '@/hooks/use-theme';

/**
 * 단어장.
 * 가리기 토글이 핵심이다 — 뜻을 보면서 외우는 것과 가리고 떠올리는 것은 학습 효과가 다르다.
 */
export default function WordListScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const theme = useTheme();
  const router = useRouter();

  const { data, isPending, error } = useDay(dayId);
  const startQuiz = useStartQuiz();

  const [hideMeaning, setHideMeaning] = useState(false);
  const [hideHeadword, setHideHeadword] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  function toggleReveal(wordId: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  }

  async function handleStart() {
    // 중단했던 응시가 있으면 새로 만들지 않고 이어 푼다
    if (data?.inProgressAttemptId) {
      router.push(`/quiz/${data.inProgressAttemptId}`);
      return;
    }

    try {
      const attempt = await startQuiz.mutateAsync({ dayId });
      router.push(`/quiz/${attempt.attemptId}`);
    } catch (e) {
      Alert.alert('시험을 시작하지 못했어요', e instanceof Error ? e.message : '다시 시도해 주세요');
    }
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
          단어장을 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.toolbar, { borderBottomColor: theme.backgroundElement }]}>
        <ToggleChip
          label="뜻 가리기"
          active={hideMeaning}
          onPress={() => setHideMeaning((prev) => !prev)}
        />
        <ToggleChip
          label="영단어 가리기"
          active={hideHeadword}
          onPress={() => setHideHeadword((prev) => !prev)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {data.words.map((word) => (
          <WordRow
            key={word.id}
            word={word}
            hideMeaning={hideMeaning}
            hideHeadword={hideHeadword}
            revealed={revealed.has(word.id)}
            onToggle={() => toggleReveal(word.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.backgroundElement }]}>
        {data.inProgressAttemptId ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.resumeHint}>
            풀던 시험이 남아 있어요
          </ThemedText>
        ) : null}
        <PrimaryButton
          label={data.inProgressAttemptId ? '이어서 풀기' : '단어시험 응시하기'}
          onPress={handleStart}
          loading={startQuiz.isPending}
        />
      </View>
    </ThemedView>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? Palette.primary : theme.backgroundElement,
          borderColor: active ? Palette.primary : theme.backgroundSelected,
        },
      ]}>
      <ThemedText type="small" style={active ? styles.chipTextActive : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function WordRow({
  word,
  hideMeaning,
  hideHeadword,
  revealed,
  onToggle,
}: {
  word: WordItem;
  hideMeaning: boolean;
  hideHeadword: boolean;
  revealed: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();

  // 가려진 항목은 탭하면 그 항목만 잠깐 보여준다
  const showMeaning = !hideMeaning || revealed;
  const showHeadword = !hideHeadword || revealed;

  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.wordRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <ThemedText type="smallBold">
        {showHeadword ? word.headword : '• • •'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {showMeaning ? word.meaningKo : '• • •'}
      </ThemedText>
      {word.exampleEn ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.example}>
          {word.exampleEn}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },
  chipTextActive: { color: '#ffffff' },
  list: { padding: 20, gap: 10 },
  wordRow: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
  },
  example: { fontStyle: 'italic' },
  footer: { padding: 20, borderTopWidth: 1, gap: 8 },
  resumeHint: { textAlign: 'center' },
});
