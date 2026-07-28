import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useQuizSession } from '@/features/vocabulary/use-quiz-session';
import { useTheme } from '@/hooks/use-theme';

/**
 * 시험 진행.
 * 선택 즉시 다음 문항으로 넘어가고 정답은 알려주지 않는다 —
 * 정답을 바로 보여주면 시험이 아니라 연습이 된다.
 */
export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const theme = useTheme();
  const router = useRouter();

  const { attempt, current, index, total, select, submitting } = useQuizSession(attemptId, {
    onFinish: () => router.replace(`/quiz/${attemptId}/result`),
    onError: (message) => Alert.alert('제출에 실패했어요', message),
  });

  const [locked, setLocked] = useState(false);

  /**
   * 중도 이탈.
   * 고른 답은 서버에 이미 저장돼 있으므로 나중에 이어 풀 수 있다.
   * 실수로 나가는 것만 막으면 되니 확인만 한 번 받는다.
   */
  function handleExit() {
    Alert.alert('시험을 중단할까요?', '지금까지 고른 답은 저장돼요. 나중에 이어서 풀 수 있어요.', [
      { text: '계속 풀기', style: 'cancel' },
      { text: '나가기', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!attempt || !current) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  async function handleSelect(choiceIndex: number) {
    if (locked) return;
    setLocked(true);
    try {
      await select(choiceIndex);
    } finally {
      setLocked(false);
    }
  }

  const progress = total === 0 ? 0 : (index / total) * 100;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {index + 1} / {total}
          </ThemedText>
          <Pressable onPress={handleExit} hitSlop={10} disabled={submitting}>
            <ThemedText type="small" themeColor="textSecondary">
              중단하기
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.promptWrap}>
        <ThemedText type="title" style={styles.prompt}>
          {current.prompt}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {current.questionType === 'EN_TO_KO' ? '알맞은 뜻을 고르세요' : '알맞은 단어를 고르세요'}
        </ThemedText>
      </View>

      <View style={styles.choices}>
        {current.choices.map((choice, choiceIndex) => (
          <Pressable
            key={`${current.wordId}-${choiceIndex}`}
            onPress={() => handleSelect(choiceIndex)}
            disabled={locked || submitting}
            style={({ pressed }) => [
              styles.choice,
              {
                backgroundColor: theme.backgroundElement,
                opacity: pressed || locked ? 0.7 : 1,
              },
            ]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.choiceNo}>
              {choiceIndex + 1}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.choiceText}>
              {choice}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {submitting ? (
        <View style={styles.submitting}>
          <ActivityIndicator />
          <ThemedText type="small" themeColor="textSecondary">
            채점 중…
          </ThemedText>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progressWrap: { gap: 8 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, backgroundColor: '#208AEF' },
  promptWrap: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  prompt: { textAlign: 'center' },
  choices: { gap: 10 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 16,
  },
  choiceNo: { width: 18 },
  choiceText: { flex: 1 },
  submitting: { alignItems: 'center', gap: 8 },
});
