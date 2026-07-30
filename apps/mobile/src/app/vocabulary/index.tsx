import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/auth-store';
import type { VocabLevel } from '@/features/auth/api';
import type { DayListItem } from '@/features/vocabulary/api';
import { useDays } from '@/features/vocabulary/use-vocabulary';
import { useTheme } from '@/hooks/use-theme';

const LEVELS: { value: VocabLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

/** 레벨 선택 → DAY 리스트. 기본값은 내 레벨이고 다른 레벨도 열람할 수 있다. */
export default function VocabularyHomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const myLevel = useAuthStore((state) => state.me?.vocabLevel ?? null);
  const [level, setLevel] = useState<VocabLevel | null>(null);

  const { data, isPending, error } = useDays(level ?? undefined);
  const selectedLevel = level ?? myLevel;

  // 레벨을 바꾸면 목록이 통째로 달라지는데 스크롤 위치는 그대로 남는다.
  // Beginner 를 DAY 20 까지 내리다 Advanced 로 옮기면 DAY 20 부터 보인다.
  //
  // 목록을 이미 받아둔 레벨로 옮기면 ScrollView 가 다시 마운트되지 않아
  // 위치가 남는다. 처음 보는 레벨은 로딩 화면을 거치며 새로 마운트돼 저절로
  // 맨 위지만, 그 경우에도 이 호출은 무해하다
  const listRef = useRef<ScrollView>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedLevel]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.wrongNoteRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="오답노트"
          onPress={() => router.push('/vocabulary/wrong-notes')}
          hitSlop={8}
          style={styles.wrongNoteLink}>
          <SymbolView
            name={{ ios: 'exclamationmark.circle', android: 'error', web: 'error' }}
            size={15}
            tintColor={Palette.primary}
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
          <ThemedText type="small" style={styles.wrongNoteText}>
            오답노트
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.levelRow}>
        {LEVELS.map(({ value, label }) => {
          const active = selectedLevel === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLevel(value)}
              style={[
                styles.levelChip,
                {
                  backgroundColor: active ? Palette.primary : theme.backgroundElement,
                  borderColor: active ? Palette.primary : theme.backgroundSelected,
                },
              ]}>
              <ThemedText type="smallBold" style={active ? styles.levelTextActive : undefined}>
                {label}
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
        <ScrollView ref={listRef} contentContainerStyle={styles.list}>
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
        {day.attemptCount > 1 ? ` · ${day.attemptCount}회 응시` : ''}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrongNoteRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12 },
  wrongNoteLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wrongNoteText: { color: Palette.primary },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  // Intermediate 가 길어 고정 폭으로는 셋이 안 들어간다. 남는 폭을 셋이 나눠 갖는다
  levelChip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelTextActive: { color: '#ffffff' },
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
