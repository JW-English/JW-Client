import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FilterChip, FilterChipRow } from '@/components/filter-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { ExamListItem } from '@/features/listening/api';
import { useExams } from '@/features/listening/use-listening';
import { useTheme } from '@/hooks/use-theme';

/** 칩에 보일 순서. 서버가 주는 종류가 늘어도 여기 없으면 뒤로 밀린다 */
const TYPE_ORDER: ExamListItem['examType'][] = [
  'SUNEUNG',
  'MOCK_9',
  'MOCK_6',
  'MOCK_3',
  'EDU_OFFICE',
];

/** 시험 선택. 연도와 시험 종류로 좁힌다. */
export default function ListeningHomeScreen() {
  const router = useRouter();
  const [year, setYear] = useState<number | null>(null);
  const [examType, setExamType] = useState<ExamListItem['examType'] | null>(null);

  const { data, isPending, error } = useExams();

  const years = useMemo(
    () => [...new Set((data ?? []).map((exam) => exam.year))].sort((a, b) => b - a),
    [data],
  );

  // 종류는 하드코딩하지 않고 실제 데이터에서 뽑는다 — 3월 학평이 들어와도 칩이 저절로 생긴다
  const types = useMemo(() => {
    const found = new Map((data ?? []).map((exam) => [exam.examType, exam.examTypeLabel]));
    return TYPE_ORDER.filter((type) => found.has(type)).map((type) => ({
      type,
      label: found.get(type) as string,
    }));
  }, [data]);

  const visible = useMemo(
    () =>
      (data ?? [])
        .filter((exam) => year === null || exam.year === year)
        .filter((exam) => examType === null || exam.examType === examType),
    [data, year, examType],
  );

  const filtered = year !== null || examType !== null;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="저장한 회차"
          onPress={() => router.push('/listening/downloads')}
          hitSlop={8}
          style={styles.downloadsLink}>
          <SymbolView
            name={{ ios: 'arrow.down.circle', android: 'download', web: 'download' }}
            size={15}
            tintColor={Palette.primary}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
          <ThemedText type="small" style={styles.downloadsText}>
            저장한 회차
          </ThemedText>
        </Pressable>
      </View>

      {years.length > 1 ? (
        <FilterChipRow>
          <FilterChip label="전체" active={year === null} onPress={() => setYear(null)} />
          {years.map((value) => (
            <FilterChip
              key={value}
              label={`${value}`}
              active={year === value}
              onPress={() => setYear(value)}
            />
          ))}
        </FilterChipRow>
      ) : null}

      {types.length > 1 ? (
        <FilterChipRow style={styles.typeRow}>
          <FilterChip label="전체" active={examType === null} onPress={() => setExamType(null)} />
          {types.map(({ type, label }) => (
            <FilterChip
              key={type}
              label={label}
              active={examType === type}
              onPress={() => setExamType(type)}
            />
          ))}
        </FilterChipRow>
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
            {filtered ? '조건에 맞는 시험이 없어요' : '등록된 듣기 시험이 없어요'}
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

function ExamCard({ exam, onPress }: { exam: ExamListItem; onPress: () => void }) {
  const theme = useTheme();
  const progress = exam.itemCount === 0 ? 0 : (exam.completedCount / exam.itemCount) * 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.82 : 1,
        },
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
  topRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12 },
  downloadsLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  downloadsText: { color: Palette.primary },
  // 연도 줄 바로 아래라 위쪽 여백을 줄인다
  typeRow: { paddingTop: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingTop: 6, gap: 12 },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: 4, backgroundColor: Palette.success },
});
