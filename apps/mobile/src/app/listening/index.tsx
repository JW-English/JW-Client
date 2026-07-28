import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ExamListItem } from '@/features/listening/api';
import { useExams } from '@/features/listening/use-listening';
import { useTheme } from '@/hooks/use-theme';

/** 시험 선택. 연도로 먼저 좁히고 시험 종류를 고른다. */
export default function ListeningHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [year, setYear] = useState<number | null>(null);

  const { data, isPending, error } = useExams();

  const years = useMemo(
    () => [...new Set((data ?? []).map((exam) => exam.year))].sort((a, b) => b - a),
    [data],
  );

  const visible = year === null ? (data ?? []) : (data ?? []).filter((e) => e.year === year);

  return (
    <ThemedView style={styles.container}>
      {years.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearRow}>
          <YearChip label="전체" active={year === null} onPress={() => setYear(null)} />
          {years.map((value) => (
            <YearChip
              key={value}
              label={`${value}`}
              active={year === value}
              onPress={() => setYear(value)}
            />
          ))}
        </ScrollView>
      ) : null}

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            시험 목록을 불러오지 못했습니다
          </ThemedText>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            등록된 듣기 시험이 없어요
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {visible.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPress={() => router.push(`/listening/${exam.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function YearChip({
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
      style={[styles.chip, { backgroundColor: active ? '#208AEF' : theme.backgroundElement }]}>
      <ThemedText type="small" style={active ? styles.chipTextActive : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ExamCard({ exam, onPress }: { exam: ExamListItem; onPress: () => void }) {
  const theme = useTheme();
  const progress = exam.itemCount === 0 ? 0 : (exam.completedCount / exam.itemCount) * 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
      ]}>
      <ThemedText type="smallBold">{exam.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {exam.itemCount}문항 · {exam.completedCount}개 학습 완료
      </ThemedText>
      <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  yearRow: { gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipTextActive: { color: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingTop: 6, gap: 12 },
  card: { borderRadius: 14, padding: 16, gap: 8 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: 4, backgroundColor: '#30A46C' },
});
