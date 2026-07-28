import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ReviewItem } from '@/features/vocabulary/api';
import { useResult } from '@/features/vocabulary/use-vocabulary';
import { useTheme } from '@/hooks/use-theme';

export default function QuizResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const theme = useTheme();
  const router = useRouter();

  const { data, isPending, error } = useResult(attemptId);

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
          결과를 불러오지 못했습니다
        </ThemedText>
      </ThemedView>
    );
  }

  const wrongCount = data.totalCount - data.correctCount;
  const elapsedSeconds = Math.max(
    0,
    Math.round(
      (new Date(data.finishedAt).getTime() - new Date(data.startedAt).getTime()) / 1000,
    ),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.scoreCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="title">{Math.round(data.score)}점</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {data.correctCount} / {data.totalCount} 정답 · {formatElapsed(elapsedSeconds)}
          </ThemedText>
          {wrongCount > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              틀린 {wrongCount}개는 오답노트에 담겼어요
            </ThemedText>
          ) : (
            <ThemedText type="small" style={{ color: '#30A46C' }}>
              모두 맞혔어요
            </ThemedText>
          )}
        </View>

        <ThemedText type="smallBold">문항별 리뷰</ThemedText>
        {data.reviews.map((review) => (
          <ReviewRow key={review.wordId} review={review} />
        ))}

        <Pressable
          onPress={() => router.dismissTo('/vocabulary')}
          style={[styles.doneButton, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">단어장으로 돌아가기</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function ReviewRow({ review }: { review: ReviewItem }) {
  const theme = useTheme();
  // 서버가 null 필드를 빼고 내려주므로 undefined 도 함께 잡는다
  const myAnswer = review.selectedIndex == null ? '무응답' : review.choices[review.selectedIndex];

  return (
    <View style={[styles.reviewRow, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.reviewHeader}>
        <ThemedText type="smallBold">{review.headword}</ThemedText>
        <ThemedText type="small" style={{ color: review.correct ? '#30A46C' : '#E5484D' }}>
          {review.correct ? '정답' : '오답'}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        정답: {review.choices[review.correctIndex]}
      </ThemedText>

      {!review.correct ? (
        <ThemedText type="small" themeColor="textSecondary">
          내 답: {myAnswer}
        </ThemedText>
      ) : null}

      {review.exampleEn ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.example}>
          {review.exampleEn}
        </ThemedText>
      ) : null}
    </View>
  );
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}분 ${rest}초` : `${rest}초`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12 },
  scoreCard: { borderRadius: 16, padding: 20, gap: 6, alignItems: 'center' },
  reviewRow: { borderRadius: 12, padding: 14, gap: 4 },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  example: { fontStyle: 'italic' },
  doneButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
});
