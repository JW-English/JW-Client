import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { FilterChip, FilterChipRow } from '@/components/filter-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import type { QuestionCategory, QuestionListItem, QuestionStatus } from '@/features/qna/api';
import { useQnaNotices, useQuestions } from '@/features/qna/use-qna';
import { useTheme } from '@/hooks/use-theme';

const CATEGORIES: { value: QuestionCategory | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'HOMEWORK', label: '숙제' },
  { value: 'VOCAB', label: '단어' },
  { value: 'LISTENING', label: '리스닝' },
  { value: 'TEXTBOOK', label: '교재' },
  { value: 'ETC', label: '기타' },
];

const CATEGORY_LABEL: Record<QuestionCategory, string> = {
  HOMEWORK: '숙제',
  VOCAB: '단어',
  LISTENING: '리스닝',
  TEXTBOOK: '교재',
  ETC: '기타',
};

const STATUS_LABEL: Record<QuestionStatus, string> = {
  PENDING: '답변대기',
  ANSWERED: '답변완료',
  REOPENED: '재질문',
  CLOSED: '종료',
};

const STATUS_COLOR: Record<QuestionStatus, string> = {
  PENDING: '#64748B',
  ANSWERED: Palette.primary,
  REOPENED: Palette.warning,
  CLOSED: '#94A3B8',
};

export default function QnaHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [scope, setScope] = useState<'public' | 'mine'>('public');
  const [answeredOnly, setAnsweredOnly] = useState(false);
  const [category, setCategory] = useState<QuestionCategory | null>(null);
  const status = answeredOnly ? 'ANSWERED' : null;

  const questions = useQuestions({ scope, category, status });
  const notices = useQnaNotices();

  const items = useMemo(
    () => questions.data?.pages.flatMap((page) => page.items) ?? [],
    [questions.data],
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.backgroundElement }]}>
        <ThemedText type="title">Q&A</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="질문 작성"
          onPress={() => router.push('/qna/new')}
          style={styles.writeButton}>
          <SymbolView
            name={{ ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' }}
            size={18}
            tintColor="#ffffff"
            weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
          />
          <ThemedText type="smallBold" style={styles.writeLabel}>
            작성
          </ThemedText>
        </Pressable>
      </View>

      <FilterChipRow>
        <FilterChip
          label="전체"
          active={scope === 'public' && !answeredOnly}
          onPress={() => {
            setScope('public');
            setAnsweredOnly(false);
          }}
        />
        <FilterChip
          label="내질문"
          active={scope === 'mine'}
          onPress={() => {
            setScope('mine');
            setAnsweredOnly(false);
          }}
        />
        <FilterChip
          label="답변완료"
          active={answeredOnly}
          onPress={() => {
            setScope('public');
            setAnsweredOnly(true);
          }}
        />
      </FilterChipRow>

      <FilterChipRow style={styles.categoryRow}>
        {CATEGORIES.map((item) => (
          <FilterChip
            key={item.value ?? 'ALL'}
            label={item.label}
            active={category === item.value}
            onPress={() => setCategory(item.value)}
          />
        ))}
      </FilterChipRow>

      {questions.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : questions.error ? (
        <View style={styles.center}>
          <ThemedText type="small" themeColor="textSecondary">
            질문을 불러오지 못했습니다
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
          refreshing={questions.isRefetching && !questions.isFetchingNextPage}
          onRefresh={() => questions.refetch()}
          onEndReached={() => {
            if (questions.hasNextPage && !questions.isFetchingNextPage) {
              questions.fetchNextPage();
            }
          }}
          ListHeaderComponent={
            <>
              {(notices.data ?? []).map((notice) => (
                <View
                  key={notice.id}
                  style={[
                    styles.notice,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="smallBold">📌 {notice.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {notice.body}
                  </ThemedText>
                </View>
              ))}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                아직 질문이 없어요. 궁금한 걸 물어보세요
              </ThemedText>
              <Pressable onPress={() => router.push('/qna/new')} style={styles.emptyButton}>
                <ThemedText type="smallBold" style={{ color: Palette.primary }}>
                  질문 작성
                </ThemedText>
              </Pressable>
            </View>
          }
          ListFooterComponent={
            questions.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          renderItem={({ item }) => <QuestionCard item={item} onPress={() => router.push(`/qna/${item.id}`)} />}
        />
      )}
    </ThemedView>
  );
}

function QuestionCard({ item, onPress }: { item: QuestionListItem; onPress: () => void }) {
  const theme = useTheme();
  const statusColor = STATUS_COLOR[item.status];

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
      <View style={styles.badges}>
        <Badge label={CATEGORY_LABEL[item.category]} color={Palette.primary} />
        <Badge label={STATUS_LABEL[item.status]} color={statusColor} />
        {!item.publicVisible ? <ThemedText type="small">🔒</ThemedText> : null}
        {item.mine ? <Badge label="내 질문" color={Palette.success} /> : null}
      </View>
      <ThemedText type="smallBold" numberOfLines={2}>
        {item.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {item.authorName} · {formatDate(item.createdAt)}
        {item.answerCount > 0 ? ` · 답변 ${item.answerCount}` : ''}
      </ThemedText>
    </Pressable>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  writeButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  writeLabel: { color: '#ffffff' },
  categoryRow: { paddingTop: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingTop: 8, gap: 12 },
  emptyList: { flexGrow: 1, padding: 20, paddingTop: 8 },
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  badges: { minHeight: 24, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  footer: { paddingVertical: 16 },
});
