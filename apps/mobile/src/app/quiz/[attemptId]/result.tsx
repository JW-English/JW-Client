import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
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
        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: data.passed ? Palette.success : Palette.danger,
            },
          ]}>
          <View
            style={[
              styles.verdictBadge,
              { backgroundColor: data.passed ? Palette.success : Palette.danger },
            ]}>
            <ThemedText type="smallBold" style={styles.verdictText}>
              {data.passed ? '합격' : '불합격'}
            </ThemedText>
          </View>

          <ThemedText type="title">{Math.round(data.score)}점</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {data.correctCount} / {data.totalCount} 정답 · {formatElapsed(elapsedSeconds)}
          </ThemedText>

          {data.passed ? (
            wrongCount > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                틀린 {wrongCount}개는 오답노트에 담겼어요
              </ThemedText>
            ) : (
              <ThemedText type="small" style={{ color: Palette.success }}>
                모두 맞혔어요
              </ThemedText>
            )
          ) : (
            // 몇 개를 더 맞혀야 했는지 알려준다. "불합격" 만 띄우면 얼마나 모자란지 모른다
            <ThemedText type="small" themeColor="textSecondary">
              {data.passPercent}% 이상이면 합격이에요 · {neededToPass(data.totalCount, data.passPercent) - data.correctCount}개 더 맞혀야 해요
            </ThemedText>
          )}
        </View>

        <ThemedText type="smallBold">문항별 리뷰</ThemedText>
        {data.reviews.map((review) => (
          <ReviewRow key={review.wordId} review={review} />
        ))}

        <Pressable
          onPress={() => router.dismissTo('/vocabulary')}
          style={[
            styles.doneButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          <ThemedText type="smallBold">단어장으로 돌아가기</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

/** 합격에 필요한 최소 정답 수. 서버 판정(correct * 100 >= total * pass)과 같은 식이다 */
function neededToPass(totalCount: number, passPercent: number) {
  return Math.ceil((totalCount * passPercent) / 100);
}

function ReviewRow({ review }: { review: ReviewItem }) {
  const theme = useTheme();
  // 서버가 null 필드를 빼고 내려주므로 undefined 도 함께 잡는다
  const myAnswer = review.selectedIndex == null ? '무응답' : review.choices[review.selectedIndex];

  return (
    <View
      style={[
        styles.reviewRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
      ]}>
      <View style={styles.reviewHeader}>
        <ThemedText type="smallBold">{review.headword}</ThemedText>
        <ThemedText type="small" style={{ color: review.correct ? Palette.success : Palette.danger }}>
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
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verdictText: { color: '#ffffff' },
  scoreCard: { borderRadius: 16, padding: 20, gap: 6, alignItems: 'center', borderWidth: 1 },
  reviewRow: { borderRadius: 14, padding: 14, gap: 4, borderWidth: 1 },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  example: { fontStyle: 'italic' },
  doneButton: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, borderWidth: 1 },
});
