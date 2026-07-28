import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import type { DayListItem } from '@/features/vocabulary/api';
import { useDays } from '@/features/vocabulary/use-vocabulary';
import { useTheme } from '@/hooks/use-theme';

const GRADES = [1, 2, 3];

/** 학년 선택 → DAY 리스트. 기본값은 내 학년이고 다른 학년도 열람할 수 있다. */
export default function VocabularyHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const myGrade = useAuthStore((state) => state.me?.grade ?? null);
  const [grade, setGrade] = useState<number | null>(null);

  const { data, isPending, error } = useDays(grade ?? undefined);
  const selectedGrade = grade ?? myGrade;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.gradeRow}>
        {GRADES.map((value) => {
          const active = selectedGrade === value;
          return (
            <Pressable
              key={value}
              onPress={() => setGrade(value)}
              style={[
                styles.gradeChip,
                {
                  backgroundColor: active ? Palette.primary : theme.backgroundElement,
                  borderColor: active ? Palette.primary : theme.backgroundSelected,
                },
              ]}>
              <ThemedText type="smallBold" style={active ? styles.gradeTextActive : undefined}>
                고{value}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            {error.message}
          </ThemedText>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            아직 열린 단어장이 없어요
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {data.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              onPress={() => router.push(`/vocabulary/${day.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function DayCard({ day, onPress }: { day: DayListItem; onPress: () => void }) {
  const theme = useTheme();
  const done = day.attemptCount > 0;

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
      <View style={styles.cardHeader}>
        <ThemedText type="smallBold">DAY {day.dayNo}</ThemedText>
        <ThemedText
          type="small"
          style={{
            color: day.inProgressAttemptId ? Palette.warning : done ? Palette.success : theme.textSecondary,
          }}>
          {day.inProgressAttemptId ? '풀던 시험 있음' : done ? `${Math.round(day.bestScore ?? 0)}점` : '미응시'}
        </ThemedText>
      </View>

      {day.title ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {day.title}
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        {day.wordCount}단어
        {day.scheduledDate ? ` · ${day.scheduledDate}` : ''}
        {day.attemptCount > 1 ? ` · ${day.attemptCount}회 응시` : ''}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  gradeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  gradeTextActive: { color: '#ffffff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  list: { padding: 20, paddingTop: 6, gap: 12 },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
