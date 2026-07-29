import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FilterChip, FilterChipRow } from '@/components/filter-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { ItemListItem } from '@/features/listening/api';
import { useItems } from '@/features/listening/use-listening';
import { useTheme } from '@/hooks/use-theme';

type ProgressFilter = 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

const FILTERS: { key: ProgressFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'NOT_STARTED', label: '안 들음' },
  { key: 'IN_PROGRESS', label: '듣는 중' },
  { key: 'DONE', label: '완료' },
];

/**
 * 진행 상태 판정.
 * 서버가 상태 필드를 따로 주지는 않지만 completed·lastPositionMs 로 충분히 갈린다.
 */
function progressOf(item: ItemListItem): Exclude<ProgressFilter, 'ALL'> {
  if (item.completed) return 'DONE';
  return item.lastPositionMs > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
}

/** 문항 선택 (1~17번). */
export default function ListeningItemsScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState<ProgressFilter>('ALL');

  const { data, isPending, error } = useItems(examId);

  const visible = useMemo(
    () => (data ?? []).filter((item) => filter === 'ALL' || progressOf(item) === filter),
    [data, filter],
  );

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
      <FilterChipRow>
        {FILTERS.map(({ key, label }) => (
          <FilterChip
            key={key}
            label={label}
            active={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </FilterChipRow>

      {visible.length === 0 ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            {filter === 'DONE'
              ? '아직 완료한 문항이 없어요'
              : filter === 'IN_PROGRESS'
                ? '듣는 중인 문항이 없어요'
                : filter === 'NOT_STARTED'
                  ? '모든 문항을 시작했어요'
                  : '문항이 없어요'}
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {visible.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onPress={() => router.push(`/listening/${examId}/${item.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function ItemRow({ item, onPress }: { item: ItemListItem; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <View style={[styles.no, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{item.itemNo}</ThemedText>
      </View>

      <View style={styles.rowBody}>
        <ThemedText type="small" numberOfLines={2}>
          {item.questionText ?? `${item.itemNo}번 문항`}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.durationMs ? formatDuration(item.durationMs) : '—'}
          {item.lastPositionMs > 0 && !item.completed ? ' · 이어듣기' : ''}
        </ThemedText>
      </View>

      {item.completed ? (
        <ThemedText type="small" style={styles.done}>
          완료
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = `${total % 60}`.padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingTop: 6, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  no: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  done: { color: Palette.success },
});
