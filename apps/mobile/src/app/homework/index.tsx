import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { AssignmentListItem } from '@/features/homework/api';
import { dDayLabel, STATUS_STYLE } from '@/features/homework/status';
import { useAssignments } from '@/features/homework/use-homework';
import { useTheme } from '@/hooks/use-theme';

export default function HomeworkListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(() => new Date());

  const { data, isPending, error, refetch } = useAssignments(month);

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  const sorted = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [data],
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.monthBar, { borderBottomColor: theme.backgroundElement }]}>
        <Pressable onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={12}>
          <ThemedText type="smallBold">‹ 이전</ThemedText>
        </Pressable>
        <ThemedText type="smallBold">{monthLabel}</ThemedText>
        <Pressable onPress={() => setMonth(shiftMonth(month, 1))} hitSlop={12}>
          <ThemedText type="smallBold">다음 ›</ThemedText>
        </Pressable>
      </View>

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            숙제를 불러오지 못했습니다
          </ThemedText>
          <Pressable onPress={() => refetch()} style={styles.retry}>
            <ThemedText type="smallBold" style={{ color: Palette.primary }}>
              다시 시도
            </ThemedText>
          </Pressable>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            이 달에는 숙제가 없어요
          </ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sorted.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onPress={() => router.push(`/homework/${assignment.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function AssignmentCard({
  assignment,
  onPress,
}: {
  assignment: AssignmentListItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const status = STATUS_STYLE[assignment.status];

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
        <View style={[styles.dot, { backgroundColor: status.color }]} />
        <ThemedText type="smallBold" style={styles.cardTitle} numberOfLines={1}>
          {assignment.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: status.color }}>
          {status.label}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        마감 {assignment.dueDate} · {dDayLabel(assignment.dueDate)}
      </ThemedText>
    </Pressable>
  );
}

function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retry: {
    padding: 8,
  },
  list: {
    padding: 20,
    gap: 12,
  },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    flex: 1,
  },
});
