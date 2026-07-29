import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import type { AttemptHistoryItem } from '@/features/me/api';
import { useAttemptHistory, useMeSummary } from '@/features/me/use-me';
import { useTheme } from '@/hooks/use-theme';

/**
 * 마이페이지.
 *
 * 담는 것은 "내가 쌓아온 것"이다 — 프로필, 단어시험 기록, 숙제 제출률.
 * 설정처럼 바꾸는 항목은 여기 두지 않는다.
 */
export default function MyPageScreen() {
  const theme = useTheme();
  const router = useRouter();
  const me = useAuthStore((state) => state.me);

  const summary = useMeSummary();
  const history = useAttemptHistory();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          <ThemedText type="subtitle">{me?.name ?? '학생'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[me?.grade ? `${me.grade}학년` : null, me?.school].filter(Boolean).join(' · ') ||
              '프로필을 설정해 주세요'}
          </ThemedText>
        </View>

        {/* 숙제 제출률 */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          숙제
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/homework')}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
              opacity: pressed ? 0.82 : 1,
            },
          ]}>
          {summary.isPending ? (
            <ActivityIndicator />
          ) : summary.error || !summary.data ? (
            <ThemedText type="small" themeColor="textSecondary">
              불러오지 못했습니다
            </ThemedText>
          ) : (
            <View style={styles.statRow}>
              <Stat label="전체" value={summary.data.homework.total} />
              <Stat label="제출" value={summary.data.homework.submitted} />
              <Stat label="검토완료" value={summary.data.homework.reviewed} />
              <Stat label="미제출" value={summary.data.homework.pending} warn />
            </View>
          )}
        </Pressable>

        {/* 단어시험 */}
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          단어시험
        </ThemedText>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
          ]}>
          {summary.isPending ? (
            <ActivityIndicator />
          ) : summary.data ? (
            <View style={styles.statRow}>
              <Stat label="응시" value={summary.data.vocabulary.attemptCount} />
              <Stat
                label="평균"
                value={summary.data.vocabulary.averageScore ?? '—'}
                suffix={summary.data.vocabulary.averageScore != null ? '점' : ''}
              />
              <Stat
                label="최고"
                value={summary.data.vocabulary.bestScore ?? '—'}
                suffix={summary.data.vocabulary.bestScore != null ? '점' : ''}
              />
            </View>
          ) : null}
        </View>

        {/* 응시 이력 */}
        {history.isPending ? (
          <ActivityIndicator style={styles.spinner} />
        ) : history.data && history.data.length > 0 ? (
          <View style={styles.historyList}>
            {history.data.map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            아직 응시한 단어시험이 없어요
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Stat({
  label,
  value,
  suffix,
  warn,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  warn?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <ThemedText type="subtitle" style={warn && value !== 0 ? styles.warn : undefined}>
        {value}
        {suffix ?? ''}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function AttemptRow({ attempt }: { attempt: AttemptHistoryItem }) {
  const theme = useTheme();

  return (
    <View style={[styles.historyRow, { borderBottomColor: theme.backgroundElement }]}>
      <View style={styles.historyBody}>
        <ThemedText type="small">
          Day {attempt.dayNo}
          {attempt.dayTitle ? ` · ${attempt.dayTitle}` : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(attempt.finishedAt)} · {attempt.correctCount}/{attempt.totalCount}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" style={scoreStyle(attempt.score)}>
        {Math.round(attempt.score)}점
      </ThemedText>
    </View>
  );
}

function scoreStyle(score: number) {
  if (score >= 90) return styles.scoreHigh;
  if (score < 60) return styles.scoreLow;
  return undefined;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 10 },
  card: { borderRadius: 14, padding: 16, gap: 6, borderWidth: 1 },
  sectionTitle: { marginTop: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  warn: { color: Palette.danger },
  spinner: { marginTop: 16 },
  empty: { textAlign: 'center', paddingVertical: 24 },
  historyList: { marginTop: 4 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyBody: { flex: 1, gap: 2 },
  scoreHigh: { color: Palette.success },
  scoreLow: { color: Palette.danger },
});
